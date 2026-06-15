---
title: "WHAT is Ratelimiting??"
description: "Deciphering rate limiting without using the word rate limit."
date: "Jun 15, 2026"
author: sku20
---

Rate-limiting, just like other overloaded terms. Tech industry like to throw out words and change their meaning what they intended represent. Anyways, i do feel rate-limit with multiple meaning inherently. But not made clear what it means.
So i will try to decipher the RateLimiting concepts today, without using the word rate-limit.

There are 2 things,

1. Flow Control
2. Quota Control

## Flow Control

The concept of flow control arises back in 80's when networking starting. People wrote thesis, papers on how to manage flow of packets. How should a router behave, what should be its queue size, when it should drop, etc. It evolved into field of network calculus. Lets not go in depth but focus on whats relevant.

Flow control means, control the flow, it could be flow of packets, requests, etc, when to accept when to drop, supporting bursts.
for our case lets consider req.
Lets take an example 5 req/s. with a burst of 10.
so what does it means?

before we can look into what it means. lets understand the standard algorithm used for flow control. "Token Bucket"
token bucket idea is pretty simple, there a bucket which got tokens and tokens are added to it every x unit. in case of 5req/s its 5 tokens per s.
When a request arrives, it maps a token to that request. map means its takes token out of the bucket.
so now we got 4 tokens left. that means we can accepts 4 more request in that second. if no token, request is dropped.

here the idea, token bucket algorithm is continuous, so it provides spacing by default.
if i am filling bucket at 5req/s that means, i am adding a single token at 1000/5 -> 200ms
so a single token is being added at 200ms. now we get spacing.
so each request have to be 200ms apart.

What about burst?
Burst serves as 2 things, its serves as initial tokens a bucket should be filled with and cap.
its easy to understand the first part. with r = 5req/s, b = 10.
it will accept burst of 10 request.
if we do not put cap on the max token. token can go to infinity and thats bad.
now we can have a burst of infinity. eg. a device can wait to 10s and 5req/s => 5 \* 10 => 50
so now it got 50 tokens in the bucket now it can burst, send 50 request at the same second.
which violates the limit we put.
so we cap the max tokens a bucket can hold and if you see it directly translates to burst.
what if we put 0. then nothing with work. it has to be `1` to achieve 5req/s with no bursts.
most implementations takes care of it, `max(1, burst)`

so i hope now its clear, 5req/s, with b=10.
burst of 10 requests then requests have to be 200ms apart.
or requests can wait and then bucket is filled can burst 10 requests.

Token Bucket has been formalized in multiple rfcs and used in old days with different protocols.
you might see, Leaky Bucket(counter) but is just mirror image of same algorithm.
with capacity = burst. and rather than removing token we add token, and if it passes more than capacity we reject the request.

```
# Token Bucket
now          = current_time()
tokens       = min(b, tokens + r × (now - last_updated))
last_updated = now

if tokens >= 1:
    tokens -= 1
    accept
else:
    reject
```

```
# Leaky Bucket (counter)
now          = current_time()
counter      = max(0, counter - r × (now - last_updated))
last_updated = now

if counter < b:
    counter += 1
    accept
else:
    reject
```

Leaky Bucket also have a queue impl. its requires memory to store the
its used streamline otherwise chaotic flow.  
so even it packets come within 1ms of 5req/s the dow steam will still see, 5req/s
the packets will be queues and bg job will pick up and send the requests.
i don't like this, until its required, since it increases memory requirements.

## Quota Control

when a cloud provider says, 10 req/min or 10 downloads/min or 10logins/10mins
what they are enforcing is a quota. they don't want flow control. and flow control/TB can't enforce these restricts properly.
with TB, its says 5req/s but actually one can send more than 5 reqs/s.
like i got bust of 10 so i can send 5 request first 10ms and then wait 200ms more and send another.
so its cannot enforce these limits properly. its not made for quota control.

for that we need something like window. and windows are typically not continuous.

<svg viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:640px;display:block;margin:1.5rem 0">

  <!-- Token Bucket — left panel (plot: x 55–295, y 25–185) -->
  <text x="175" y="14" text-anchor="middle" fill="#a8a29e" font-size="11" font-family="Space Grotesk,sans-serif">Token Bucket</text>
  <line x1="55" y1="25" x2="55" y2="185" stroke="#44403c" stroke-width="1"/>
  <line x1="55" y1="185" x2="295" y2="185" stroke="#44403c" stroke-width="1"/>
  <line x1="55" y1="45" x2="295" y2="45" stroke="#292524" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="50" y="49" text-anchor="end" fill="#78716c" font-size="10" font-family="Inter,sans-serif">b</text>
  <text x="175" y="202" text-anchor="middle" fill="#78716c" font-size="10" font-family="Inter,sans-serif">time →</text>
  <text x="16" y="110" text-anchor="middle" fill="#78716c" font-size="10" font-family="Inter,sans-serif" transform="rotate(-90,16,110)">tokens</text>
  <!-- sawtooth: diagonal refill, sharp drops on request arrival -->
  <polyline points="55,165 100,45 112,85 118,105 165,45 178,85 225,45 237,77 248,109 295,45"
    fill="none" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>

  <!-- Fixed Window — right panel (plot: x 350–620, y 25–185) -->
  <text x="485" y="14" text-anchor="middle" fill="#a8a29e" font-size="11" font-family="Space Grotesk,sans-serif">Fixed Window</text>
  <line x1="350" y1="25" x2="350" y2="185" stroke="#44403c" stroke-width="1"/>
  <line x1="350" y1="185" x2="620" y2="185" stroke="#44403c" stroke-width="1"/>
  <line x1="350" y1="45" x2="620" y2="45" stroke="#292524" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="345" y="49" text-anchor="end" fill="#78716c" font-size="10" font-family="Inter,sans-serif">limit</text>
  <text x="485" y="202" text-anchor="middle" fill="#78716c" font-size="10" font-family="Inter,sans-serif">time →</text>
  <text x="314" y="110" text-anchor="middle" fill="#78716c" font-size="10" font-family="Inter,sans-serif" transform="rotate(-90,314,110)">count</text>
  <!-- window boundary -->
  <line x1="485" y1="25" x2="485" y2="185" stroke="#44403c" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="417" y="218" text-anchor="middle" fill="#57534e" font-size="9" font-family="Inter,sans-serif">← window →</text>
  <text x="485" y="218" text-anchor="middle" fill="#78716c" font-size="9" font-family="Inter,sans-serif">reset</text>
  <text x="553" y="218" text-anchor="middle" fill="#57534e" font-size="9" font-family="Inter,sans-serif">← window →</text>
  <!-- staircase window 1 (5 requests, each step: 27px wide, 28px tall) -->
  <polyline points="350,185 377,185 377,157 404,157 404,129 431,129 431,101 458,101 458,73 485,73 485,45"
    fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="miter"/>
  <!-- reset drop (dashed) -->
  <line x1="485" y1="45" x2="485" y2="185" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3"/>
  <!-- staircase window 2 -->
  <polyline points="485,185 512,185 512,157 539,157 539,129 566,129 566,101 593,101 593,73 620,73 620,45"
    fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="miter"/>

</svg>

it would be hard to go further without taking a impl.
lets take the basic fixed window. impl.

```
# Fixed Window (Redis)
now   = current_time()
key   = "rl:{user}:{floor(now / 60)}"   # new key every minute

count = INCR key
if count == 1: EXPIRE key 60            # TTL = window size

if count > limit: REJECT
```

so when i say, 10 login/min,
its 10 logins per minute,
all 10 logins attempts can happen in first 10 seconds itself.
there's not flow control.
but in one minute there should only be 10 logins. thats the quota.
which we are fulfilling. so its like a staircase graph. where the counter is reset at every minute.

this is fixed window has to wait until next minute to retry,
implementations are very simple. easily distributable.  
rolling windows are hard to implement from scaling pov. cloudflare([How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)) did try to get around it with algorithm which does approximation.

## TB Vs FW

lets talks about one things, our token bucket impls are continuous cause tokens are calculated lazily. what if we run a bg job to do that.
lets say per second.
in that case, TB becomes a fixed window. since now continuity is lost. its becomes a fixed window.
and spacing is gone. so fundamentally its how much continuous the filling is makes the spacing better.
on that, in router and typical hardware, TB is implemented to fill tokens at each clock cycles.
its still staircase but its being filled so fast that its close to a line.

one last caveat TB is easy to implement in process but hard to implement in distributed system.
Fixed windows is easy there. But again they server different purposes so it makes sense only.
you want flow control to stop your services from exploding under heavy load.
you want quota to enforce limits. most prob. business requirements. directly or indirectly. like otp, etc.

## tldr;

Decide what you want, flow control or quota.
Token Bucket -> flow control, which imo fits definition of rate limit more cleanly
Window -> quota control.
