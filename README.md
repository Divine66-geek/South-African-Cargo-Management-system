# SACMS demo (simple version

South African cargo management businesses struggle with capturing proof of how package conditions are transported from area to area so this system helps them easy identify on whether the package was transported damaged or did it get damaged during transit, by allowing workers and clients to upload the picyure of the condition of the parcel before being shiped and how it arrived to the destination.

This is a:
    A clickable prototype with sample data stored in the browser (localStorage). No backend or database.

## Run it in VS Code
1. File > Open Folder, choose this folder.
2. Install the **Live Server** extension (VS Code suggests it).
3. Right-click `index.html` > **Open with Live Server**. (Double-clicking `index.html` also works.)

## The flow
1. **Client** creates an account as a **company** or an **individual**, then registers a shipment: what they are sending, where it is collected, the destination, and a **photo of the product being transported**.
2. **Admin** sees the new shipment (marked New) and confirms the container number.
3. **Field worker** sees **all** containers, can **search** by container number, shipment code, client or goods, and filters by All, Available or Mine. They **assign themselves** to an available one. A progress bar shows today's inspections against the **daily target of at least 20 containers**. Once it has arrived, they add a photo, pick **Good condition** or **Damaged**, add notes and submit.
4. **The client is notified automatically** the moment the report is submitted: an update on their tracking page, an in-app notification, and a simulated email saying the goods are in good condition or that damage was found.
5. **Admin** sees the report under **Reports**, and the **Workers** tab ranks workers by inspections (today, last 7 days or all time), shows damage found, who met today's target, and lets the admin change the daily target.
6. **Admin** reads the report under **Reports**. Good reports need no action. For damage, the admin sends a follow-up with details and next steps (the client is notified again).
7. Anyone with the shipment code can also use **Track** (no account needed).

## Demo accounts (password for all: `scacms`)
- Admin: thandi@sca.demo
- Field workers: sipho@sca.demo, johan@sca.demo
- Client (company): anele@client.demo
- Client (individual): marike@client.demo

New clients choose their own password when they create an account.

## Demo tracking codes
SCA-10021 to SCA-10025

Use **Reset demo** in the top bar to restore the sample data.

## Files
- `index.html` page shell
- `css/styles.css` styles
- `js/app.js` data and behaviour
- `images/container.jpg` background photo for the first page (sign in, create account, track)
