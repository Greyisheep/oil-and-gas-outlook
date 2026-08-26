# Style guide, as read from the Figma file

Values below were read off the Figma properties panel element by element, not
matched by eye. Frame `Dashboard`, node 2-60.

## Colour
| Token | Hex | Where |
|---|---|---|
| ground, card | `#FFFFFF` | page, sidebar, cards, Note pill |
| well | `#F7F7F7` | metric wells, chart plot areas |
| sidebar active | `#F5F5F5` | selected nav item |
| rule | `#EAEAEA` | all borders, 0.8px |
| Header | `#2D2D2D` | headings, values, panel titles |
| Body | `#5A5A5A` | body copy, labels |
| Lighter | `#777777` | captions, subtitles |
| positive | `#199E70` | good values |
| negative | `#E66767` | bad values |
| warning | `#C98500` | caution values |

## Type — Inter throughout
| Name | Weight | Size / line | Tracking | Used for |
|---|---|---|---|---|
| H6/Medium | 500 | 24 / 32 | −0.5px | every headline number |
| Body-04/Semibold | 600 | 14 / 20 | 0 | section heading |
| Body-04/Medium | 500 | 14 / 20 | 0 | panel titles, labels, buttons |
| Body-04/Regular | 400 | 14 / 20 | 0 | body copy |
| Caption-01/Regular | 400 | 12 / 18 | 0.15px | captions, subtitles, sources |

## Layout
- **Sidebar** 280px fixed, 16px padding, right border 0.8px.
  Brand row 248 x 59. Group label 248 x 34. Nav item 248 x **32 fixed**,
  radius **12px**, active fill `#F5F5F5`, **no gap between items**.
- **Section** blocks each carry **24px padding** and a **bottom border 0.8px**.
  There is no gap between blocks; the padding does that work.
- **Metric row** gap 16px. **Chart row** gap 24px, card height 380px.
- **Card** radius **16px**, border 0.8px, padding **12px**, internal gap **20px**.
- **Metric well** radius 12px, padding 10px, gap 12px.
- **Plot area** radius **10px**, fill `#F7F7F7`.
- **Note button** hug 57 x 28, radius **9px**, border 0.8px, padding 4px / 12px.
- **Title icon** 16px, 8px gap before the title.
