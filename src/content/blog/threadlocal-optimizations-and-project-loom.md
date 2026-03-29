---
title: "ThreadLocal Optimizations And Project Loom"
description: "Debugging silent failures in asynchronous Java code and understanding why ThreadPools might be swallowing your exceptions."
date: "Mar 29, 2026"
author: sku
---

This is going to be one of those optimization episodes where simple tricks can yield good performance.

First, let’s talk about profilers,
There are multiple profilers in java ecospace,
But the 2 most important ones are Java Flight Recorder, and Async Profiler.

Java Flight Recorder is provided by the java or openjdk itself. Whereas Async Profiler is written by Andrei Pangin.
In github async profiler you can find what all things its doing better than JFR. like safepoint bias, capturing native stackframes, etc.

I used async profiler extensively to profile and figure out the patterns. Not that i could not use JFR, actually jfr gives much more data than async profiler, but due to it taking 100% cpu when attaching it. It deoptimizes the methods which affect the performance significantly.

Anyways, async profiler has multiple modes, cpu, wall clock, alloc, being the most important and most used.
One good thing about it is it can generate .jfr files. And we can use any .jfr viewer to read the data.

There is Java Mission Control given by the openJDK, then there is VisualVM, and lastly there is Intellij Idea profiler which can read jfr.

I mostly use idea one, it highlights the methods code is spending time in, where allocations are happening and the graphs are good and other relevant details. If more extensive analysis is required, JMC or VisualVM is that way. Tbh i still don’t understand their UI. :(

Anyways, lets move on to the interesting part. The quick optimizations.

Since our physical devices send so much data, this data is encrypted. Encryption and decryption is the hot path we will try to optimize here.

After reading the flame graphs over multiple days, I figure if we can optimize this path somehow.
Of course db queries will be no lagging behind, but they were not in the hot path.
Encrypt and Decrypt is the hot path, since every packet has to go through this flow.

Since we are allocating less now, less objects are getting created. That means, our memory is being filled slowly so we have more time before the next gc is triggered, and since objects are less gc will have less time collecting.
It's one of the problems with garbage collected languages. When gc runs it takes your cpu, so sometimes, cpu spikes are the result of too much allocations.
In this case if we can reduce that we are good.

The Solution, "ThreadLocal"

Ok, before we do that, let's understand how we can reduce the allocations of the encryptor and decryptor.

Let’s start small, a single encryptor, now since it is not thread safe, if multiple threads try to encrypt with it, it would fail or worse it would output corrupted data.
So, an easy solution, let’s use a lock; the problem: it's not scalable at all. It will be a huge bottleneck.

So what's a better way, since only one thread can use an encryptor at a time, let’s maintain a set of encryptors and use them to do encryption. A simple implementation would be a wrapper which maintains a list of encryptors and randomly selects one and uses a lock/synchronized primitive to do the encryption.

But we can do better. We can let the client borrow the encryptor and return it after it has used it.
They can perform things with it without locking primitives since that encryptor will be exclusive to them.
This idea is called Object Pooling. And Golang does it extensively, even for the strings.

The downside is, when borrowing and returning, the operations have to be atomic. And making sure the object is returned back can be tricky to implement.

Anyways, since I am not going to let loose the encryptor, it would always be under a wrapper. My only concern was making the pool atomic, which involves locking which could be avoided better.

So comes ThreadLocal. Threadlocal concept is simple, you can make a object threadlocal and can access it anywhere in code. Its like static but only within that threads content. This access anywhere idea is used by most JVM frameworks. But it has some issues now. We will come to that later.

For this case, ThreadLocal is the best way, no locking, no allocations, nothing, and code wise no changes apart from saying this a threadlocal. Scaling wise also not much issues, if i increase the thread count my encryptors will increase if i reduce they will reduce.

It works great, next time I profiled, it's like this hot stack frame doesn’t exist.

Now to the demerits,
Why does golang not have threadlocals??
Cause there are no threads. lol.
No to be serious, problem is multiple coroutines can use the same threads,
Or a single coroutine can use multiple threads.
And we don’t know when it's going to be scheduled or where.
So it can leave the encryptor in invalid state.

So the best solution is object pooling which you can see used extensively in the golang ecosystem.

How is this related to java/jvm?
Since the introduction of virtual threads by project loom, the threadlocal concept is gone. It can’t be used.
So our solution to using threadlocal as a pool to reduce allocation of resources is gone.
But I also mentioned how these frameworks are using ThreadLocal to store and retrieve data.
That's a different problem, which object pooling cannot solve, so Java is introducing a new concept called Scoped Values. Which these frameworks can use. Its like being tired to the content of Virtual Thread.

Why not make VirtualThread Local?
Well Scoped Values are kind of like that, but they don't solve the encryptor problem.
Since I can create 100 virtual threads, each for a packet, I don't want to create an encryptor for each packet.
We can tweak it since we have both virtual threads and threads but the best option with virtual threads is object pooling.

Where are the graphs?
I did all this 2 yrs back, i tried to find the graphs, but they were lost during the time i migrated from the old pc.


## links
https://github.com/async-profiler/async-profiler
https://stackoverflow.com/questions/78188660/java-flight-recorderjfr-consumes-100-cpu-when-its-supposed-to-have-only-1-2
