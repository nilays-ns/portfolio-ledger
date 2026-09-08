# Portfolio Ledger

A small, private portfolio growth calculator. Add your own asset classes and values, set a monthly contribution plan, and see where your money is likely headed in 5, 10, 25 — or any number of — years.

**No backend, no accounts, no analytics.** Everything runs client-side in the browser; nothing you type is ever saved or sent anywhere unless you explicitly click **Export**.

## Features

- Fully editable asset table — add, rename, or delete rows for any asset class (SIP, PF, stocks, gold, crypto, real estate, whatever applies to you)
- Per-asset expected return and contribution-split inputs
- A monthly contribution plan with a flat period, then a step-up amount on whatever cycle you choose
- Three editable milestone years (defaults: 5 / 10 / 25) with a value + contributed/growth breakdown for each
- A chart comparing "continuing to invest" against "stopping today"
- Optional inflation adjustment (view everything in today's rupees/dollars/etc.)
- Resizable table columns (drag the edge of any header; double-click to reset)
- Tooltips on every column header explaining what it means
- Export / Import as JSON, so you can save your plan or hand a friend a starting point

## Running it

It's a static site — there's nothing to build or install.

- **Locally:** just open `index.html` in a browser.
- **GitHub Pages:** push this repo to GitHub, then go to *Settings → Pages*, and set the source to your default branch, root folder. Your calculator will be live at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

```
index.html      — markup
css/style.css   — styling
js/app.js       — the calculator logic (state, projections, chart, table)
favicon.svg     — tab icon
```

## Notes on the model

Each asset compounds monthly at the return rate you set. New monthly money is split across assets by the "% of monthly investment" column (read relative to each other — they don't need to sum to exactly 100) and isn't rebalanced afterward. This is a planning tool, not a forecast or financial advice — real returns for equities, gold, or anything else will be far less smooth than a constant annual rate implies, and the model doesn't account for taxes.

## License

MIT — see [LICENSE](LICENSE).
