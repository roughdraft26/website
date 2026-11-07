# Rough Draft Creatives · running the website

Everything on this site that changes is edited at **`/admin`** on your own
website. You never need to touch code, and you never need a developer for
ordinary updates.

This file is the manual. Keep it in the repository so it cannot be lost.

---

## Part 1 · How it is set up

This is already done and working. It is written down so that whoever looks
after the site next can see how the pieces fit together.

Everything below is on a free plan. Nothing here costs money.

### The accounts

All three belong to Rough Draft Creatives, not to any individual. They are all
tied to `connect@roughdraftcreatives.ie`.

| What | Where | Does what |
|---|---|---|
| GitHub | user `roughdraft26`, repository `website` | Holds the site and every version of it |
| Vercel | `roughdraft26's projects`, project `website` | Serves the site, rebuilds on every save |
| Cloudflare | Worker `sveltia-cms-auth` | Hands sign-in off to GitHub |

The domain `roughdraftcreatives.ie` is registered at Register365. Its DNS
points at Vercel. **Do not change the MX records**, they carry the email.

### How a save reaches the website

Someone edits at `/admin` and saves. The editor writes the change straight into
the GitHub repository. Vercel sees the change and redeploys. The site is live
about a minute later. There is no separate publish step and no approval queue.

### The sign-in helper

GitHub will not accept a sign-in directly from a static site, so a small
free Cloudflare Worker sits in between. It is deployed at:

```
https://sveltia-cms-auth.connect-1cf.workers.dev
```

It pairs with a GitHub OAuth App called **Rough Draft Creatives CMS**, owned by
`roughdraft26`. The Worker holds three settings: the app's client ID, its
client secret, and `ALLOWED_DOMAINS`, which is set to
`www.roughdraftcreatives.ie` so the Worker only ever signs people in from this
site.

The matching values live in `admin/config.yml`:

```yaml
repo: roughdraft26/website
branch: main
base_url: https://sveltia-cms-auth.connect-1cf.workers.dev
```

None of this needs touching again unless the repository moves or the Worker is
redeployed.

### Giving someone editing access

Add them as a collaborator on `roughdraft26/website` with **write** access.
GitHub, repository, Settings, Collaborators, Add people.

That is all they need. They go to `/admin` and sign in with their own GitHub
account.

### Taking access away

Remove them as a collaborator. That cuts them off immediately, whether or not
they are signed in. Do not share one login between people, give each person
their own GitHub account so access can be removed one at a time.

---

## Part 2 · Day to day

Go to **`https://www.roughdraftcreatives.ie/admin`** and sign in with GitHub.

Anything you save goes live in about a minute. There is no separate publish
step and no approval queue.

### Add the next gathering

1. **Events**, then **Upcoming and past events**, then **Add event**.
2. Fill in the date, the title, the time, the place.
3. Add the flyer, and describe it in **Flyer description**.
4. Save.

What happens by itself, with nothing else for you to do:

- the new date appears at the top of the Next dates list
- the flyer on the page swaps to the new one
- the pop-up that greets visitors switches to the new gathering, **including
  for people who already closed the previous one**
- when the date passes, the event disappears from the site and the pop-up
  stops. **You do not delete old events.** Leave them. They become the record.

### Add an archived draft

1. **Archived Drafts**, then **Add draft**.
2. Number and title.
3. Add the photograph and describe it in **Photograph description**.
4. If the gathering happened but the pictures are not ready, leave the
   photograph empty and tick **Pictures still to come**.
5. Save.

### Add a reflection

A reflection is the write-up someone contributes after a gathering. Open the
draft it belongs to, write it in the **Reflection** box, put the author in
**Reflection written by**, and save.

You can use **bold**, *italics* and links. Headings, pictures and tables are
deliberately not offered, so the page keeps the shape it was designed with.

### Space Weavers, Network supports, Poetry

Same pattern. Open the section, add an entry, save.

### Settings

Contact email, Instagram, the Google Form link and the pledge amounts.
These rarely change. Be careful with the contact email: get it wrong and
nobody can reach you through the site.

---

## Part 3 · Pictures

### Do this once on your phone, and HEIC never bites you

iPhones photograph in a format called HEIC that most browsers cannot display.
The editor will refuse those files, which is better than a broken picture on
the site, but the fix is on the phone:

**Settings → Camera → Formats → Most Compatible**

From then on the phone shoots ordinary JPEGs and everything just works.

### The rules the editor enforces for you

- **JPEG, PNG or WebP only.** HEIC is refused, and so is SVG, which can
  carry hidden code.
- **5 MB maximum.** A huge photograph makes the site slow for everyone.
  If a file is refused for size, email it to yourself and choose
  "Medium" or "Large" rather than "Actual Size".

### Always write the description

Every picture has a description field. It is read aloud to people who use a
screen reader, and shown if the picture fails to load. Describe what is
actually happening in the photograph. "Photo" is not a description.

---

## Part 4 · When something goes wrong

### You made a mistake and want it back

Every save is recorded. Go to the repository on GitHub, open **Commits**, find
the change, and revert it. Nothing is ever really lost, including deleted
entries and replaced pictures.

### A section of the site has gone empty

Almost always a broken content file. Open the repository, look in `content/`,
and check the file for that section. Reverting the last change fixes it.

The site is built so that one broken content file empties one section and
leaves the rest of the site working. It cannot take the whole site down.

### If the editor will not open

First try a private or incognito window, which rules out a stale sign-in.

If it still will not open, the sign-in helper is the usual cause. There is a
second way in that does not depend on it:

1. On GitHub, create a **fine-grained personal access token** limited to this
   one repository, with **Contents: read and write** permission.
2. At `/admin`, choose **Sign In Using Access Token** and paste it.

That gets you working again the same day. Treat the token like a password,
and delete it on GitHub when the helper is fixed.

### The site is down entirely

That is Vercel or DNS, not the editor. Check the Vercel dashboard first.

---

## Part 5 · Things not to touch

- **`content/*.json`** by hand. The editor writes these. Editing them
  directly is how a section gets broken.
- **`admin/cms/`**. That is the editor's own program, kept here on purpose
  so the site does not depend on anyone else's server.
- **`vercel.json`**. It carries the security settings for the whole site.

---

## For whoever maintains this next

The site is plain HTML, CSS and JavaScript. No framework, no build step, no
server code. A folder of files served as they are.

- Content is JSON in `content/`, read by `app.js` at page load
- The editor is Sveltia CMS, vendored at `admin/cms/`, version in `VERSION.txt`
- Security headers, including the Content Security Policy, live in `vercel.json`
- The public site runs `script-src 'self'` with no inline scripts. If you add
  one, the browser will refuse to run it. Put it in a file instead.
- Reflections render through a deliberately small Markdown renderer in
  `app.js` that allows paragraphs, bold, italic and links, and builds DOM
  nodes rather than parsing HTML. Do not replace it with `innerHTML`.

To update the editor: `npm pack @sveltia/cms`, then replace the contents of
`admin/cms/` with the package's `dist` folder. Check `/admin` still opens
afterwards.
