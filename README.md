# Westbound: Visa Desk prototype

Interactive prototype of a job tracker for young Europeans (18–30) looking for internships, graduate programmes, first jobs and study in the San Francisco Bay Area.

The core feature is the **Visa Desk**, a chatbot docked in the bottom-right corner. It answers visa questions using:
- the user's profile (citizenship, studies, work experience, who they're moving with), and
- the role in focus (selected in the tracker or in the chat's "Asking about" menu).

Changing the profile changes the answers. For example, switching citizenship from Germany to France turns the Kessler & Vogt E-2 graduate programme into a nationality mismatch, and switching studies to a US Master's makes the J-1 internship ineligible. Both the tracker and the chat update.

Open `index.html` in a browser. Outside claude.ai the chat uses a built-in rule-based guide ("Guide" badge). When published as a claude.ai artifact, it uses Claude for live answers ("Live · Claude" badge) and falls back to the guide if that isn't available.

All companies and people are fictional example data. Visa information reflects rules as of mid-2026 and is not legal advice.
