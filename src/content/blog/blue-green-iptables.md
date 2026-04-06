---
title: "Blue Green with Iptables"
description: ""
date: "Apr 6, 2026"
author: sku
---

The backend takes time to boot up which is enough to be considered as downtime. Missing critical packets, requests, etc.
In a real time system, even 1s of downtime can cause multiple issues.

It used to take ~4min, but now after some optimizations it's reduced to ~30s.

Before I enabled zero downtime deployment for the backend, we used to deploy at night to reduce the disturbance.
Actually this is the first thing I did, so I never deployed like that.

Right Now, flow is very simple, you run github actions, which is manually triggered, it runs the tests, and creates a github release.
That github release triggered a webhook to the server, where it pulls the image, and runs the swap script.

Swap script is pretty simple, it maps the outside ports to inside ports.
The script has 2 sets of ports. We store the currently running set reference in a mapped.txt file.
This way swap knows which ports are being used by the currently running image.

So idea is pretty simple,
You have 1000 which swap script maps to 1001 or 1002 depending on context. Ie. which image is already running.

So steps are like this,
Github triggers webhook
Download the latest image from github release
Symlink the image to this downloaded image
Run swap.sh
figure out which image type is being run by reading mapped.txt
Initialize new and old ports variables.
Start the new image providing new ports.
After its running, it is validated by health check.
Swap the external ports mapping to new ports from old.
Send termination signal to old image.

Now Swapping external ports mapping to internals is done with help of iptables.
Fundamentally, i need not even go into iptables level and could just run a proxy in front which does it for me.
But again, we are talking about performance here, another hop introduction will definitely decrease that.

On a side note, prev. K8s used to have its own proxy which does traffic redirections, but for quite some time, they have switched over to using iptables.
Its way more performant.
Now idk, we have quite more options, CNI, eBPF, etc.

Anyways, Where are the commands?

> to add
```
iptables -A PREROUTING -t nat -p udp -m udp --dport ${EXTERNAL_PORTS[0]} -j DNAT --to-destination :${NEW_MAPPING[0]}
```
> to delete
```
 iptables -D PREROUTING -t nat -p udp -m udp --dport ${EXTERNAL_PORTS[0]} -j DNAT --to-destination :${CURRENT_MAPPING[0]}
```

Quite evident.

But one problem is there, it will only route your new connections; the old one will still point to old ports.
That is because of nat.

So theres a thing called conntrack it tracks/maps the src tuple to the destination tuple, so it knows where to send back the packet.
We need to flush that table so connections are mapped properly to new mapping.
ie. `conntrack -F`.

Now the 2nd problem,
Since I don't want 2 places to update mapping and all.
My nginx config always has 8080 as upstream.
But it won’t work.

The issue is that the PREROUTING chain doesn’t capture the internally routed packets.
For that we have to use the OUTPUT chain.
And then it works.

But there is one quirk, to do internal routing we need to enable internal forwarding.
`sudo sysctl -w net.ipv4.ip_forward=1`

After this everything should work flawlessly.
If things don't work you can always use tcpdump to capture packets or netstat/ss to check the dropped packets.

Thats how i figured about the conntrack, the packets were dropping.

Anyways, iptables is a legacy tool at this moment. I want to replace all this with Nftables. But idk, this is working quite well, as they say, don’t touch if it isn’t broken.


Why no k8s or something else.
I researched docker but it doesn’t support this kind of thing, you can run multiple services but update is not rolling or blue green, its shutdown all then bring all back up. Unlike k8s.
As for k8s, its a huge system on its own. It was not needed when I started, but now I am exploring it.
Helm, operators, cni, etc. trying to understand the abstraction and their uses.
Integrations with aws, gcp, etc. like pod roles, etc.

