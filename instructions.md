### **Instructions for Using the Discord Moderation Bot**  

#### **1. Bot Permissions Required**  
Before using the bot, ensure it has the following permissions in your Discord server:  
✅ **Timeout Members** (For muting/unmuting)  
✅ **Ban Members** (For banning/unbanning)  
✅ **Manage Messages** (If needed for message moderation)  

🔹 **Only moderators and admins** can use these commands. Normal users cannot execute these actions.

---

#### **2. Bot Command Format & Usage**  
The bot will recognize specific keywords in messages and perform actions accordingly.  

### **Mute a User**  
📌 **Command:** `km @User [duration] [reason]`  
➡️ **Example:**  
- `km @John 7d promotion` → Mutes John for **7 days**.  
- `km @John 7d` → Mutes John for **7 days** with no reason provided.  
- `km @John` → Mutes John for the **default 10 minutes**.  

📌 **Duration Format:**  
- `s` → Seconds (e.g., `30s`)  
- `m` → Minutes (e.g., `10m`)  
- `h` → Hours (e.g., `2h`)  
- `d` → Days (e.g., `7d`)  
- `w` → Weeks (e.g., `2w`)  

🔹 **If no duration is provided, it defaults to 10 minutes.**  

📌 **Bot Response:**  
- `"Done! Muted @User for 7d. Reason: promotion"`  
- `"Done! Muted @User for 7d. Reason: reason not provided"`  

---

### **Unmute a User**  
📌 **Command:** `kum @User`  
➡️ **Example:** `kum @John` → Unmutes John immediately.  

📌 **Bot Response:**  
- `"Done! Unmuted @User"`  

---

### **Ban a User**  
📌 **Command:** `kb @User [reason]`  
➡️ **Example:**  
- `kb @John spamming` → Bans John with reason "spamming".  
- `kb @John` → Bans John with no reason provided.  

📌 **Bot Response:**  
- `"Done! Banned @User. Reason: spamming"`  
- `"Done! Banned @User. Reason: reason not provided"`  

---

### **Unban a User**  
📌 **Command:** `kub @User`  
➡️ **Example:** `kub @John` → Unbans John.  

📌 **Bot Response:**  
- `"Done! Unbanned @User"`  

---

#### **3. Notes & Restrictions**  
🔹 The bot does **not** use traditional `!commands` but detects specific keywords.  
🔹 Ensure the bot has the correct permissions in server roles.  
🔹 The mute function uses Discord’s **timeout system**, so muted users can’t send messages or speak in voice channels.  
🔹 The bot does **not** reply to messages when executing commands but will send a confirmation message.  
🔹 **Only moderators and admins can use these commands.**  

---
