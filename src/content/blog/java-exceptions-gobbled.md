---
title: "Java Exceptions Gobbled"
description: "Exploring XDP, iptables, and nftables to build a high-performance UDP echo server in the Linux kernel."
date: "Mar 22, 2026"
author: sku
---

The other day when I was trying to debug an issue, I couldn't find any error logs. I looked everywhere, loki, system err, system out, container logs, nowhere to be found.
Since it was running on production, I cannot just attach the debugger. So static analysis it was.
It went through all the paths and still no clue why it wasn’t working. No clue to be found where it was crashing.

I tried recreating the same issue locally where I can attach a debugger, but I couldn't. But I got another peculiar issue, intellij step over was getting stuck.

Anyways it was unrelated to the issue at hand, so i continued my way statically, after multiple static analysis and with still no clue, I was done.
Time to increase log verbosity. I added some new log statements and deployed the changed code. I made sure to only log for the particular device to reduce the verbosity, a custom log function which checks device id before logging the message.

I got where it's failing, typical printf debugging. And after some data checking, I figured it was trying to query a non-existent row. The query data was corrupted.

But what is intriguing is, if the db query is failing, why isn’t it being logged. Where are the logs?
Why are they missing? It's like java is consuming exceptions.

And sure it was;
The issue was, since this part of the code is async, I am running it in a separate threadpool.
And the way threadpool handles unhandled exceptions, it first checks for exception handler in its thread factory, if not there, it falls back to global exceptional handler. NOOP being the default.

Looks like an easy fix, added a global exception handler. But while testing again, no exception logs.

I was pissed at this point, I was like just wrap the runnable in try catch and be done.
But then again, java’s the industry standard and what not. It should not be this pita. There has to be something I was missing, down the rabbit hole we go.

And after some research I figured try catch is the best solution.
The thing is, when you submit or schedule ThreadPools, return future, and that future will capture any unhandled exceptions that happen for that particular runnable. It will throw it back when you call .get(), but I don’t need that, futures are useless to me.

So the best option is to create a wrapper LoggingRunnable which takes a Runnable and wraps it in try catch.
Some decisions by the Java community I don't really get. Like they're shoving futures down the throats.
I can still use execute in ThreadPools which will not create future but scheduled threadpool i can’t. It will always create a scheduled future. Even though I don’t want it, I am still paying the cost.

It could be so much better if the exception handler still works, and we have a way to opt out of this future thing.

Also, the intellij gets stuck on step over; it looks like there's some bug in intellij, when you step over at the last line of runnable, it gets stuck.
So rather than step over at the end, just continue.

