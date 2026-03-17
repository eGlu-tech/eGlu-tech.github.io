---
title: "UDP Echo Server For NAT"
description: "Writing UDP Echo Server with Linux Kernel"
date: "Mar 17, 2026"
author: sku
---

One problem with udp based system is with nat. Ipv6 is supposed to solve this. Since every device will global reachable address.
For now we have to deal with the nat. Until router have nat mapping, packets cannot be forwarded in side the private subnet. To make it work packets have to be originated from inside first then we can send
Now i don’t want to go in nat transversal and all that esp for p2p.
Until now one way was working, client devices were sending junk udp packet to the server every 8 secs.
Now some routers started blocking them, esp jio one. But once we started responding back to those 8s packets it started working.

But that's additional overhead reaching the userspace process.
To solve this scalability problem, I reached out to some tools given by the linux kernel.

## iptables
- Iptables is a legacy filtering and processing tool given by linux kernel.
- Were using it to drop the nat packets. Before it can even hit conntrack-ing.
- But cannot use it to reflect the back. very limited cannot do much.

## eBPF/XDP (eXpress Data Path)

- XDP runs directly in the network driver (or even on the NIC hardware), processing packets before the kernel even allocates an sk_buff (socket buffer).
- By "reflecting" the packet at the lowest possible layer, we can avoid the entire overhead of the Linux networking stack, context switching to user-space, and memory copying.
- Writing a small C-based eBPF program that swaps the Source/Destination MACs and IPs, then returns XDP_TX to transmit the packet back out to the same interface.
- Needs to Manually calculate checksums of ethernet, ip, udp.

I felt its too low level, i was feeling unsafe working at that level.

## nftables

- Nftables is a new filtering and processing tool given by linux kernel. Modern alternative to iptables.
- safer than XDP because the kernel handles the low-level memory safety, but it’s faster than a user-space process because the packet stays in the kernel.
- Nftable is way easier to maintain than iptables rules. We can maintain the chains and rules in .nft script files.

There are multiple protocol levels and hook i can put my reflection logic. 
After doing some research i figure out ip level and prerouting hook before conntrack is a good place to put my logic.

Documentation is badly lacking for these essential tools. I can’t find any good resources, i have to do trial and error in script until it started working.
Apart from that, the script is quite clear what's happening.
once note, since its stateless nat, values have to be hardcoded. we can maintain a dynamic map but again its kinda like nat only. So just hardcode. 
i was thinking if i can extract src ip from the interface but i couldn't find anything.

## code

https://gist.github.com/sku0x20/6d0c93595d949c1c1cac3dd4d2155da6

## reference
https://people.netfilter.org/pablo/nf-hooks.png
