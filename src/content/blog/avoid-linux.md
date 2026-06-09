---
title: "Avoid - A Void Linux Distribution"
description: ""
date: "June 9, 2026"
author: sku20
---

I wanted a minimal system which i can use for build machines and sometimes for recovery. it was frustrating to find anything like this.
every distro i tested was bloated. i thought server distros will be smaller in size but they too same issue.

after trying out some, i settled for void. i was going for debian but systemd just too bloated. after i tasted the minimalism. its hard to go back.
i tested its fork devuan but things just didn't felt right. its like too much magic is going on.
i tried zypper based tumbleweed. specifiucally qemu image, its quite small, but still something felt disturbing.
maybe systemd.

So i made a custom linux distribution based on void.

problem with void is its a user distro but i want a server one. it includes so many unecessary firmware blobs and all.
like wifi and sound.
i have removed most of the packages but kernel modules remain. i didn't wanted to build the kernel so i left them as is for now.

it was a journey, sparse files, zerofilling, and the regular chroot and install stuff thing.
i like the void tooling. xchroot specifically its setup up things for me.
i like the packages also not that convuluted. easy to query the dependencies, list files, etc.
void also follows the minimalism principle. what i felt it lacked was a server distro.

Void docs are very clean and straightforward unlike other distros. where you can't find info at the same place. its scattered all over the place.

as the minimalism person i am, i avoid their tool also like mklive and all. i went with more of a hands-on approach. custom build script. tbh its much simpler and all.
i am only using the necessary tools.

anyways, i have 2 files, one .qcow2 which can be used

also, the releases are github-actions based, it was tricky to get it to work but its working now.

next step would be to create a container image and use that to build itself. for now i am pretty happy with the result.

also, i added some minimalistic defaults for zsh, and yes i am using zsh as default user shell. and sh is symlinked to dash.

i am really pleased on how fast boot is. ~300MB of ram consumtion and countable processes.

check out https://github.com/sku0x20/avoid
