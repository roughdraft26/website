# Rough Draft Creatives · running the website

Everything on this site that changes is edited at **`/admin`** on your own
website. You never need to touch code, and you never need a developer for
ordinary updates.

This file is the manual. Keep it in the repository so it cannot be lost.

---

## Part 1 · Setup, once only

Three values in `admin/config.yml` are marked `FILL IN`. Until they are filled
in, the editor will not sign in. Someone technical does this once.

### 1. The repository

The site must live in a GitHub repository owned by **Rough Draft Creatives**,
not by any individual. An organisation account is better than a personal one,
because people can be added and removed without handing over a password.

In `admin/config.yml`:

```yaml
repo: your-org/your-repo        # for example: roughdraftcreatives/website
branch: main
```

### 2. Connect the repository to Vercel

In Vercel, open the project, then Settings, then Git, and connect it to that
repository. From then on the site rebuilds by itself every time something is
saved in the editor. Nothing is uploaded by hand ever again.

### 3. The sign-in helper

The editor signs people in through GitHub. That needs a small free helper
service, because GitHub will not accept a sign-in directly from a static site.

1. Create a **GitHub OAuth App** under the organisation's settings.
   Developer settings, then OAuth Apps, then New OAuth App.
   Homepage URL: `https://www.roughdraftcreatives.ie`
   Authorization callback URL: the worker address from step 2 below, plus
   `/callback`.
2. Deploy the **sveltia-cms-auth** worker to a free Cloudflare account.
   It is a copy-and-deploy job, no code to write. The project's own
   instructions cover it.
3. Put the worker address into `admin/config.yml`:

```yaml
base_url: https://your-worker-name.workers.dev
```

The Cloudflare account should also be in the organisation's name.

### 4. Give the editor access

Add them to the GitHub organisation with **write** access to the repository.
That is all they need. They sign in at `/admin` with their GitHub account.

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
