import type { BrainSpec } from "../engine/brains";

export interface NpcSpec {
  id: string;
  name: string;
  desc: string;
  room: string;
  hp: number;
  attack?: number;
  defense?: number;
  brain: BrainSpec;
}

export const NPCS: NpcSpec[] = [
  {
    id: "innkeeper",
    name: "Branfin the Innkeeper",
    desc: "A broad man with a bread-crumb beard and sharp, amused eyes.",
    room: "inn_common",
    hp: 40,
    attack: 3,
    defense: 6,
    brain: {
      type: "scripted",
      params: {
        greeting: "Welcome to the Pewter Mug, traveler. You look like you have walked the road. Stew is on.",
        ambient: ["More ale over here, Mira, if you please!", "Mind the step, friend.", "Do not feed the cellar rats. I mean it."],
        ambient_every: 18,
        dialogue: {
          stew: "Two copper a bowl. Warms the feet, not the purse.",
          rat:  "The cellar is thick with them. If you clear them out, come up and see me.",
          key:  "Keys? Who loses keys these days? The cottage over the road, maybe — the old woman is always misplacing hers.",
          peak: "No one climbs it alone twice. Remember that.",
        },
      },
    },
  },
  {
    id: "shopkeeper",
    name: "Adela the Shopkeeper",
    desc: "A wiry woman in a patched apron. Ink on her fingers.",
    room: "merchant_shop",
    hp: 28,
    attack: 1,
    defense: 3,
    brain: {
      type: "scripted",
      params: {
        greeting: "In for something in particular, or just looking? The herbs are fresh. The rumors are free.",
        ambient: ["*mutters numbers under her breath*", "*re-stacks a pile of skeins*"],
        ambient_every: 25,
        dialogue: {
          herb:  "Healing herbs grow on the eastern slope. Do not pick the blue-flowered ones.",
          cave:  "Behind the waterfall, yes. No, I will not be going.",
          wight: "You would be a fool to wake it. Which is why I will not tell you how to.",
          sword: "The smith is out, but his work is good. A rusty blade is still a blade.",
        },
      },
    },
  },
  {
    id: "old_woman",
    name: "the old woman",
    desc: "Tiny, stooped, eyes bright as river stones.",
    room: "cottage_ext",
    hp: 20,
    attack: 1,
    defense: 2,
    brain: {
      type: "scripted",
      params: {
        greeting: "Ah, a visitor. You will not find anything worth taking, but you are welcome all the same.",
        ambient: ["*scatters grain for the chickens*", "*sighs, watching the road*"],
        ambient_every: 22,
        dialogue: {
          key:  "I lost the key to the cellar a fortnight ago. If you come across it, I would be grateful.",
          road: "The road east runs to the meadow, but the glade goes further than it looks.",
          peak: "My son went up the peak. He did not come down.",
        },
      },
    },
  },
  {
    id: "player_gorim",
    name: "Gorim Ironfoot",
    desc: "A stocky traveler in a patched leather coat, sword at hip.",
    room: "village_square",
    hp: 35,
    brain: {
      type: "wanderer",
      params: {
        move_every: 10,
        chat_every: 14,
        engage_for: 30,
        greeting: "Aye, well met. You look road-worn, same as me.",
        farewell: "Luck to you. Mind the cellar rats.",
        lines: [
          "Anyone seen the innkeeper's daughter?",
          "Gold for a decent blade.",
          "Cleared the cellar rats last week. Easy work.",
          "The tomb is a bad idea. I am saying this for you, free.",
        ],
        dialogue: {
          rat:   "Rats in the cottage cellar, rats in the inn cellar. Whole village is lousy with them. Fair pay if you clear them.",
          tomb:  "I will say it plain: the wight in that tomb has killed better than you or me. Turn around if you have any sense.",
          inn:   "The Pewter Mug. Branfin is fair, if you do not mind his ribbing.",
          peak:  "I went halfway once. The wolves in the pass were enough reason to come back.",
          sword: "Smith is out most days. He leaves blades in the forge if you know where to look.",
          help:  "I am not your hireling, friend. But I will point you at the inn or the shop.",
          where: "Village square. Inn is south, shop west through the alley, smith north. Road east leads to the foothills.",
          name:  "Gorim Ironfoot. Second son of a miner, for what that is worth.",
        },
      },
    },
  },
  {
    id: "player_mira",
    name: "Mira the Wayfarer",
    desc: "A slim figure in a green cloak. Bow across her back.",
    room: "east_meadow",
    hp: 30,
    brain: {
      type: "wanderer",
      params: {
        move_every: 9,
        chat_every: 11,
        engage_for: 30,
        greeting: "Oh — hello. Did not hear you come up.",
        farewell: "Walk softly.",
        lines: [
          "The brook is flush with trout today.",
          "The peak is not for tonight.",
          "Heard the goblin is back at the hut.",
          "*hums a tune*",
        ],
        dialogue: {
          goblin: "There is a goblin at the hunter's hut. Small, but it bites. The hunter's knife is still inside.",
          trout:  "The brook runs east of here. Trout are big this year. I would lend you a line, but I have only the one.",
          bow:    "Yew. Old one. Not for sale.",
          glade:  "Follow the meadow east to the glade. Quiet place. The sage keeps to himself there.",
          sage:   "The Sage of the Hollow. He speaks in riddles more than answers. Still, worth a visit.",
          heron:  "There is a heron at the pond who pretends to be invisible. He is bad at it.",
          peak:   "Not the peak. Not today. The wind up there does things to your head.",
          where:  "Meadow. Road's west. Glade east, pond south. You want the foothills, go back to the narrow road.",
          name:   "Mira. The 'Wayfarer' was someone's joke that stuck.",
        },
      },
    },
  },
  {
    id: "player_saro",
    name: "Saro the Ranger",
    desc: "Tall, quiet, a hawk-feather through his braid.",
    room: "lower_foothills",
    hp: 32,
    brain: {
      type: "wanderer",
      params: {
        move_every: 12,
        chat_every: 16,
        engage_for: 30,
        greeting: "*nods slowly*  Traveler.",
        farewell: "*raises a hand*  Go well.",
        lines: [
          "Tracks in the scree. Fresh.",
          "Wolf. Upslope.",
          "Keep low at the pass.",
          "*nods silently*",
        ],
        dialogue: {
          wolf:  "One wolf, maybe two. They den above the pass. Do not go up without steel, and not alone.",
          track: "Scree moves when a heavy step breaks it. I read what I see. Today: wolf, and one traveler — you.",
          pass:  "The pass is narrow and loud with wind. If you hear anything else, turn around.",
          peak:  "No one goes up the peak twice. I have only been once.",
          cave:  "Behind the waterfall. Bats, last I checked. Something nests past the bats.",
          bow:   "I carry one but prefer the knife. Close work is honest.",
          where: "Foothills. South is the road. North climbs. West is the hunter's hut — quiet of late.",
          name:  "Saro. Just Saro.",
        },
      },
    },
  },
  {
    id: "sage_hollow",
    name: "the Sage of the Hollow",
    desc: "A bent figure wrapped in grey, staff in hand, eyes bright beneath the hood.",
    room: "glade",
    hp: 30,
    attack: 2,
    defense: 4,
    brain: {
      type: "openclaw_demo",
      params: {
        persona: "a wandering sage who prefers riddles to answers",
        goal: "learn what the traveler seeks",
        act_every: 7,
      },
    },
  },
];
