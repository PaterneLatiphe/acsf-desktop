# Source & license — GOV.UK Frontend Tabs reference

These files are verbatim reference copies downloaded for design study only. They are **not** installed, imported, or bundled by ACSF Desktop. No application code or runtime dependencies were changed.

## Files and exact source URLs

| Local file | Source URL |
| --- | --- |
| `tabs.mjs` | https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/components/tabs/tabs.mjs |
| `tabs.template.njk` | https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/components/tabs/template.njk |

## Author / project

- Project: GOV.UK Frontend (`alphagov/govuk-frontend`), maintained by the Government Digital Service (GDS), Crown Copyright.
- Component authors: GOV.UK Frontend contributors / Government Digital Service.

## Exact license

MIT License

Copyright (C) 2017 Crown Copyright (Government Digital Service)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

License source: https://github.com/alphagov/govuk-frontend/blob/main/LICENSE.txt

## Date accessed

2026-11-20

## Reference note

GOV.UK Frontend v5.5.0 (August 2024) removed Up/Down arrow key bindings for tabs because they conflict with screen-reader navigation; Left/Right arrows remain. Preserve any existing Home/End support in the local implementation.
