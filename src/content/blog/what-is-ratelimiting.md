---
title: "WHAT is Ratelimiting??"
description: "Deciphering rate limiting without using the word rate limit."
date: "Jun 15, 2026"
author: sku20
---

Rate-limiting — just like other overloaded terms. The tech industry likes to throw out words and change their intended meaning. I do feel rate-limit has multiple meanings inherently, but the docs and references that use it rarely make it evident which one they mean.

So I'll try to decipher the rate-limiting concepts today, without using the word rate-limit.

There are 2 things:

1. Flow Control
2. Quota Control

## Flow Control

The concept of flow control goes back to the 80s, when networking was starting out. People wrote theses and papers on how to manage the flow of packets — how a router should behave, what its queue size should be, when to drop, etc. It evolved into the field of network calculus. Let's not go in depth, but focus on what's relevant.

Flow control means controlling the flow — packets, requests, etc. — deciding when to accept, when to drop, and how to handle bursts.

For our case, let's think in terms of requests.

Take an example: 5 req/s with a burst of 10. What does that mean?

Before we can answer that, let's understand the standard algorithm used for flow control: the Token Bucket.

The idea is simple — there's a bucket with tokens, and tokens are added to it at a fixed rate. For 5 req/s, that's 5 tokens per second.
When a request arrives, it takes a token out of the bucket. Now there are 4 tokens left — 4 more requests can be accepted. If there are no tokens, the request is dropped.

The token bucket algorithm is continuous, so it provides spacing by default.
If I'm filling the bucket at 5 req/s, I'm adding a single token every 1000/5 = 200ms.
So each request has to be 200ms apart.

What about burst?

Burst serves 2 purposes: it's the initial number of tokens the bucket is filled with, and it's the cap.

With r = 5 req/s and b = 10, it will accept a burst of 10 requests up front.

If we don't cap the max tokens, they can grow to infinity — and that's bad.
A device could wait 10s and accumulate 5 × 10 = 50 tokens, then burst 50 requests at once. That violates the limit entirely.

So we cap the max tokens a bucket can hold, and that cap is directly the burst.
If burst = 0, nothing would work. It has to be at least `1` to achieve 5 req/s with no burst.
Most implementations handle this: `max(1, burst)`.

So: 5 req/s with b = 10 means 10 requests can burst immediately, then each has to be 200ms apart. Or requests wait, the bucket fills up, and they burst again.

Token Bucket has been formalized in multiple RFCs and used across many older protocols.

You might also see the Leaky Bucket (counter) — it's just a mirror image of the same algorithm.
Same capacity = burst, but instead of removing a token, you add to a counter. If the counter exceeds capacity, reject the request.

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

Leaky Bucket also has a queue implementation. It requires memory to buffer requests and is used to streamline otherwise chaotic flow.
Even if requests come within 1ms of each other, the downstream will still see a steady 5 req/s — requests are queued and a background job picks them up at the fixed rate.
I don't like this unless it's strictly required, since it increases memory overhead.

## Quota Control

When a cloud provider says 10 req/min, 10 downloads/day, or 10 logins/10min — what they're enforcing is a quota. They don't care about flow control. And TB can't enforce these limits properly.

With TB at 5 req/s and b = 10, I can send 10 requests in the first 10ms, wait 200ms, and send more. It can't enforce a hard quota — it's not built for that.

For quotas, you need a window. And windows are discrete, not continuous.

![Token Bucket vs Fixed Window](/graphs/rate-limiting-comparison.svg)

Hard to go further without a concrete impl. Let's take the basic fixed window:

```
# Fixed Window (Redis)
now   = current_time()
key   = "rl:{user}:{floor(now / 60)}"   # new key every minute

count = INCR key
if count == 1: EXPIRE key 60            # TTL = window size

if count > limit: REJECT
```

So when I say 10 logins/min — all 10 attempts can happen in the first 10 seconds. There's no flow control. But within that minute, only 10 are allowed. That's the quota.

It's a staircase: the counter climbs, hits the limit, and resets at the window boundary.

Fixed window means waiting until the next window to retry. Implementations are simple and easy to distribute.

Rolling windows are harder to scale. Cloudflare ([How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)) tried to work around it with an approximation algorithm.

## TB vs FW

Our token bucket impls are continuous because tokens are calculated lazily. What if we ran a background job to refill them instead — say, once per second?

In that case, TB becomes a fixed window. Continuity is lost, and so is the spacing. Fundamentally, the more continuous the refill, the better the spacing.

In routers and hardware, TB fills tokens at every clock cycle. Still a staircase technically, but filled so fast it's practically a straight line.

One last caveat: TB is easy to implement in-process but hard in a distributed system. TB requires shared, continuously-updated state — tokens and last_updated need to be in sync across nodes, which requires coordination. Fixed Window is easy there: a single atomic INCR in Redis does the job. But that makes sense — they serve different purposes.

Use flow control to stop your services from blowing up under heavy load.
Use quota to enforce limits — usually business requirements, directly or indirectly. OTP attempts, download caps, login throttling.

## tldr;

Decide what you want: flow control or quota.
- Token Bucket → flow control, which IMO fits the definition of rate limit more cleanly.
- Window → quota control.
