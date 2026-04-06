---
title: "Blue Green with Iptables"
description: "How I achieved zero downtime deployments on a bare metal server using iptables port swapping and blue-green deployments — without Kubernetes."
date: "Apr 6, 2026"
author: sku
---

The backend takes time to boot up, which is long enough to be considered downtime — missed packets, dropped requests, the works.
In a real-time system, even 1 second of downtime can cause multiple issues.

It used to take ~4 minutes, but after some optimizations it’s down to ~30 seconds. Still, that’s 30 seconds too many.

Before I enabled zero downtime deployments, the plan was to deploy at night to minimize disturbance.
But this was the very first thing I worked on, so I never actually had to do that.

---

Right now, the flow is simple: you trigger GitHub Actions manually, it runs the tests, and creates a GitHub release.
That release triggers a webhook to the server, which pulls the image and runs the swap script.

The swap script is pretty simple — it maps outside ports to inside ports.
The script has 2 sets of ports, and we store the currently active set in a `mapped.txt` file.
This way, the script always knows which ports the running image is using.

The idea is straightforward: you have external port `1000`, and the swap script routes it to either `1001` or `1002` depending on which image is currently running.

Steps look like this:

1. GitHub release triggers the webhook
2. Download the latest image from the GitHub release
3. Symlink the image to this downloaded image
4. Run `swap.sh`
5. Read `mapped.txt` to figure out which image is currently running
6. Initialize new and old port variables
7. Start the new image on the new ports
8. Validate it’s up via health check
9. Swap the external port mapping from old ports to new
10. Send a termination signal to the old image

---

The port swapping is done with iptables.
I could’ve just run a proxy in front to handle this — but we’re talking about performance here, and adding another hop would definitely hurt that.

On a side note, Kubernetes used to have its own proxy for traffic redirection, but they switched to iptables a while back for the same reason — it’s just more performant.
Now there are even more options: CNI, eBPF, etc.

Anyway, the commands:

> to add
```
iptables -A PREROUTING -t nat -p udp -m udp --dport ${EXTERNAL_PORTS[0]} -j DNAT --to-destination :${NEW_MAPPING[0]}
```
> to delete
```
iptables -D PREROUTING -t nat -p udp -m udp --dport ${EXTERNAL_PORTS[0]} -j DNAT --to-destination :${CURRENT_MAPPING[0]}
```

Pretty self-explanatory.

---

**Problem 1: existing connections still route to old ports.**

This is a NAT thing. There’s a subsystem called `conntrack` that tracks the source tuple → destination tuple mapping, so the kernel knows where to send reply packets. When you update the iptables rules, existing connections are still tracked under the old mapping.

The fix is to flush the conntrack table: `conntrack -F`.

---

**Problem 2: nginx can’t reach the new port internally.**

I don’t want to update port references in two places, so my nginx config always points to `8080` as the upstream. The idea is that iptables handles the redirect internally — but it doesn’t work out of the box.

The `PREROUTING` chain only captures packets coming in from outside. For internally routed packets (like nginx talking to localhost), you need the `OUTPUT` chain instead. Switching to that fixes it.

There’s one more thing — for internal routing to work, you need to enable IP forwarding:

```
sudo sysctl -w net.ipv4.ip_forward=1
```

After that, everything works.

If something’s off, `tcpdump` is great for capturing packets and `netstat`/`ss` can help spot dropped connections. That’s actually how I tracked down the conntrack issue — packets were dropping silently.

---

iptables is technically a legacy tool at this point. I’d like to migrate to nftables eventually, but honestly, this is working well. Don’t touch what isn’t broken.

---

**Why not Kubernetes?**

Docker alone doesn’t support this kind of thing — you can run multiple services, but updates are not rolling or blue-green. It’s shutdown-all, then bring-all-back-up.

Kubernetes does support it, but it’s a large system with a steep learning curve. It wasn’t necessary when I started this project. I’m exploring it now though — Helm, operators, CNI, pod roles tied to AWS/GCP IAM, etc. Trying to understand the abstractions and when they’re actually worth the overhead.

