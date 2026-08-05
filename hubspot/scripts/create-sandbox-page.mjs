// One-time: creates the sandbox /news page, referencing the 3 uploaded
// modules. Widget-tree shape copied from ngen-trade-intel's
// create-prod-pages.mjs (same layoutSections structure, dumped once from a
// real trade-intel page via the Pages API).
import { Client } from '@hubspot/api-client';
import fs from 'fs';
import moduleIds from './module-ids.json' with { type: 'json' };

const token = fs.readFileSync(process.env.HOME + '/.hubspot_sandbox_private_app_token', 'utf-8').trim();
const client = new Client({ accessToken: token });

const MOD = moduleIds.sandbox;

function widget(label, moduleKey, name) {
  return {
    cssStyle: '',
    label,
    type: 'custom_widget',
    params: { css_class: 'dnd-module', module_id: parseInt(MOD[moduleKey], 10), schema_version: 2 },
    rows: [],
    rowMetaData: [],
    cells: [],
    cssClass: '',
    w: 12,
    cssId: '',
    x: 0,
    name,
  };
}

function layoutSections(widgets) {
  return {
    dnd_area: {
      cssStyle: '',
      label: 'Main section',
      type: 'cell',
      params: {},
      rows: [
        {
          '0': {
            cssStyle: '',
            type: 'cell',
            params: { css_class: 'dnd-column' },
            rows: widgets.map((w) => ({ '0': w })),
            rowMetaData: widgets.map(() => ({ cssClass: 'dnd-row' })),
            cells: [],
            cssClass: '',
            w: 12,
            cssId: '',
            x: 0,
            name: 'cell_news',
          },
        },
      ],
      rowMetaData: [{ cssClass: 'dnd-section' }],
      cells: [],
      cssClass: '',
      w: 12,
      cssId: '',
      x: 0,
      name: 'dnd_area',
    },
  };
}

async function main() {
  const widgets = [
    widget('news-subnav', 'news-subnav', 'widget_subnav_news'),
    widget('news-feed', 'news-feed', 'widget_feed_news'),
    widget('news-footer', 'news-footer', 'widget_footer_news'),
  ];

  const body = {
    name: 'Manufacturing News',
    slug: 'news',
    templatePath: '@hubspot/elevate/templates/blank.hubl.html',
    layoutSections: layoutSections(widgets),
    htmlTitle: 'Manufacturing News | NGen',
    metaDescription: 'Daily manufacturing news across 5 verticals, curated for NGen.',
  };

  const created = await client.cms.pages.sitePagesApi.create(body);
  console.log(`Created sandbox page: /news -> id ${created.id}`);
  console.log('View at: https://51764260.hs-sites.com/news');
}

main().catch((err) => {
  console.error(err.body ? JSON.stringify(err.body, null, 2) : err);
  process.exit(1);
});
