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

// Dialogue conventions (see engine/brains/scripted.ts):
//   firstGreeting/greeting/farewell → sequence of lines (one turn)
//   dialogue[topic] → array = variants (random, avoids consecutive repeat)
//   Embed `\n` for multi-line within a variant.
//   Wrap a line in `*...*` to render it as an emote (Branfin wipes a glass.)

export const NPCS: NpcSpec[] = [
  // --------------------------------------------------------------------
  // BRANFIN — the innkeeper. Warm but worn, gruff, notices things.
  // Father of Mira the Wayfarer (cross-referenced).
  // --------------------------------------------------------------------
  {
    id: "innkeeper",
    name: "Branfin the Innkeeper",
    desc: "A broad man with a bread-crumb beard and sharp, amused eyes.  Wipes a glass that was never dirty.",
    room: "inn_common",
    hp: 40,
    attack: 3,
    defense: 6,
    brain: {
      type: "scripted",
      params: {
        firstGreeting: [
          "*wipes down a glass, looks up*",
          "Welcome to the Pewter Mug. Haven't seen your face before.",
          "Stew's on the hob. Ale's in the cellar. Sit a while."
        ],
        greeting: [
          "*nods*",
          "Back again. What'll it be?"
        ],
        topicsHint: "Ask about the stew, the rats, keys, the peak, my daughter, rumor — or say 'bye' when you're done.",
        fallback: [
          "Hm. Can't say I know much on that.",
          "*scratches his ear*  Not my department, friend.",
          "Couldn't tell you. Ask Adela at the shop — she reads more than is good for her."
        ],
        farewell: [
          "*raises a hand*",
          "Mind the step."
        ],
        ambient: [
          "*wipes a glass*",
          "*ladles something*",
          "More ale over here, if you please!",
          "Mind the step, folks.",
          "Don't feed the cellar rats. I mean it.",
          "*to himself: 'Mira, where are you...'*",
          "*taps a keg, listens*"
        ],
        ambient_every: 18,
        dialogue: {
          stew: [
            "Meat and root. Two copper a bowl. Warms the feet, not the purse.",
            "*ladles a bowl*\nAte it myself for breakfast. Still here.",
            "Three copper with bread. Bread's mine, root's from the old woman's garden. Meat doesn't answer questions."
          ],
          rat: [
            "*spits toward the hearth*\nAye. Cellar's thick with them, the little bastards.",
            "If you clear them, come up and tell me. I'll stand you stew and a bed — no charge.",
            "Lost three bottles of the summer stock last week. Trapdoor's behind the bar."
          ],
          rats: [
            "*spits toward the hearth*\nAye. Cellar's thick with them, the little bastards.",
            "Clear the wine casks and I'll stand you stew and a bed.",
            "If you've a blade, I've a cellar and a problem."
          ],
          ale: [
            "Brown ale, three copper. Summer's stock — don't ask about the new brew.",
            "*thumbs toward the back*\nCellar's where I'd send you for more, if it weren't for the rats."
          ],
          drink: [
            "Ale, wine, water. Water's free. The rest is not.",
            "You look like you've had a hard walk. First one's still two copper, but I'll pour it generous."
          ],
          key: [
            "Keys? *scratches chin*",
            "The old woman across the road's always losing hers.",
            "If you've found a brass one, that's hers. She'd weep for it."
          ],
          peak: [
            "*sets the glass down slowly*",
            "No one climbs it alone twice. Folk who say otherwise are lying or worse.",
            "If you must go, go with Saro. Keeps to the lower slopes, but he knows the wind up there."
          ],
          rumor: [
            "*leans on the bar*",
            "Rumor? The sage in the glade has been even stranger of late. Says the wind carries a name.",
            "Whose, he won't say. Probably nobody's. He's like that."
          ],
          rumors: [
            "*leans on the bar*",
            "Two. One — the sage is off his feet, saying the wind carries a name.",
            "Two — there are tracks above the pass. Saro's seen them. A wolf, he says. Just one."
          ],
          sage: [
            "The sage? Harmless. Mostly.",
            "Speaks in riddles. Answers one question with two more.",
            "The sort who'd say 'yes' when you ask him the way to the cellar."
          ],
          tomb: [
            "*grunts coldly*\nFolk who go in don't always come out. And the ones who do aren't the same folk they were.\nTake that plain.",
            "Cemetery gate south of the road. Wight in the back. Not worth it.",
            "Leave it alone. That's my advice."
          ],
          wight: [
            "*sets down the glass, this time on purpose*",
            "Keep out of the tomb. The wight doesn't want company it can't keep.",
            "If you've steel, find Halvard the smith first. Rusty blade won't do."
          ],
          daughter: [
            "*sets the glass down, slowly*\nMira. She's out in the meadow most days. 'Wayfarer,' she calls herself. Won't come home.\nIf you see her — tell her her father asked after her. Don't tell her I looked sad when I said it."
          ],
          mira: [
            "My daughter.",
            "Tall girl, green cloak, bow on her back. You'll know her — she looks like she's listening to something you can't hear.",
            "Ask her about the peak and watch her face go still."
          ],
          gold: [
            "Two copper for stew, three for ale, six for a bed.",
            "Bed's clean. Blanket's older than you. That's the deal."
          ],
          coin: "Spent or unspent, a coin is still a coin. Three for ale.",
          help: [
            "Gate's east. Smithy's north — if Halvard's in it, you're a better man than me.",
            "Shop's west through the alley. Foothills are back on the road.",
            "Don't take the tomb path unless you mean trouble."
          ],
          where: [
            "You're in the Pewter Mug, traveler. Village square to the north.",
            "Road's east. The land proper is east of that."
          ],
          smith: [
            "Halvard's out more than he's in. Check the anvil — a good blade cools in the bucket some days.",
            "He doesn't talk much. He'll nod if you're civil. Leave coin on the anvil."
          ],
          halvard: "The smith. Quiet man. Good work. Wife died last spring. He's been like that since.",
          sword: [
            "Smith makes them. I don't. Two doors north.",
            "If you mean steel, Halvard's your man. If you mean courage, only the road teaches that."
          ],
          song: [
            "Know one about a shepherd boy who cried wolf and was eaten by three.",
            "Buy me an ale and you'll hear it. Sober, I'm not a singer."
          ],
          bed: [
            "Upstairs, six copper, ask before dark.",
            "Sheets are clean. Blanket's wool and older than you."
          ],
          home: "My grandfather built this inn with his own two hands. Same hearth, same beams, same damn rats.",
        }
      }
    }
  },

  // --------------------------------------------------------------------
  // ADELA — the shopkeeper. Dry, sardonic, literate. Ink-stained fingers.
  // --------------------------------------------------------------------
  {
    id: "shopkeeper",
    name: "Adela the Shopkeeper",
    desc: "A wiry woman in a patched apron. Ink on her fingers. She peers over spectacles that don't quite fit.",
    room: "merchant_shop",
    hp: 28,
    attack: 1,
    defense: 3,
    brain: {
      type: "scripted",
      params: {
        firstGreeting: [
          "*peers over her spectacles*",
          "New face. In for something in particular, or just looking?",
          "Herbs are fresh. Rumors are free."
        ],
        greeting: [
          "*doesn't look up from her ledger*",
          "Back, are we. Close the door, please."
        ],
        topicsHint: "Ask about herbs, the cave, the wight, the smith, the sage, books, or rumor.",
        fallback: [
          "*closes the ledger with one finger*\nThat's outside my specialty, I'm afraid.",
          "Hm. You'd want the innkeeper for that sort of question. He's the one who gets paid to listen.",
          "I sell things and I keep a ledger. The rest is gossip, and gossip is free — ask Branfin across the way."
        ],
        farewell: [
          "*waves a hand without looking up*",
          "Mind the step. And the ink."
        ],
        ambient: [
          "*mutters numbers under her breath*",
          "*re-stacks a pile of skeins*",
          "*dips her quill, writes slowly*",
          "*pours cold coffee into a saucer*",
          "*thumbs through an older ledger, frowning*"
        ],
        ambient_every: 25,
        dialogue: {
          herb: [
            "Healing herbs grow on the eastern slope. Pick the pale-green ones.",
            "*points at a bundle on a shelf*\nThree copper a handful, already dried. Or pick your own, if you fancy bending over."
          ],
          herbs: [
            "Eastern slope, pale-green leaves. Blue-flowered ones will make you sleep. Longer than you want.",
            "I've a sign up about it, but people don't read. Present company included?"
          ],
          cave: [
            "Behind the waterfall, yes. No, I won't be going.",
            "*taps a page*\nLast three men who went in came out with stories. Two of the three didn't come out at all."
          ],
          wight: [
            "You'd be a fool to wake it. Which is why I won't tell you how to.",
            "*sets down the quill*\nThe tomb's doors aren't locked, traveler. They're courteous. Don't insult the courtesy."
          ],
          tomb: [
            "Cemetery gate's south of the road. Don't go in after dark.",
            "Don't go in at all, if I'm honest. But since when has anyone honest stopped you?"
          ],
          sword: [
            "The smith is out. His work's good. Rusty doesn't mean dull — a rusty blade is still a blade.",
            "I don't sell them. I sold one, once, to a man who later used it on himself. Decided that was the last.",
          ],
          smith: [
            "Halvard. Widower. Good hands, quieter than the anvil. Leave coin if you take something.",
            "If he's not there, leave a note. If you can't write, leave a drawing. He likes drawings."
          ],
          halvard: "Good man. Too quiet. I'd say he needs company but he'd probably bolt at the word.",
          book: [
            "*brightens fractionally*\nI've three that aren't for sale. One account of the siege, one herbal, one of questionable poetry.",
            "If you can read — and many here can't — come back before supper. I'll lend the herbal."
          ],
          books: "Mostly ledgers. Some history. One volume of indifferent poetry I keep for reasons I won't examine.",
          sage: [
            "The sage in the glade? Useful, if you know how to listen.",
            "He answers the question you should've asked, not the one you did.",
            "I don't always forgive that, but I respect it."
          ],
          rumor: [
            "*thumbs through the ledger*\nRumor: the goblin is back at the hunter's hut. Poor goblin.",
            "Rumor: someone was seen at the peak at dusk. I don't believe it. You can't be seen at the peak and live."
          ],
          rumors: [
            "The goblin's back at the hut. Same one, probably — they're stubborn.",
            "A wolf above the pass, hunting alone. Alone wolves are the worst kind."
          ],
          peak: [
            "I'd rather not.",
            "The old woman's son went up. She doesn't say it, but she's waiting."
          ],
          inn: "The Pewter Mug. Branfin's a decent man, even if he pours short when he thinks you're not looking.",
          branfin: "Branfin keeps a fair house. Daughter left. He bears it. Barely.",
          ink: [
            "*lifts her fingers*\nYes, I know. It doesn't come off. I no longer try.",
            "Ink is the only thing I buy more of than I sell. Read into that what you like."
          ],
          coin: "Prices are on the shelves. Haggling's allowed. I'll win.",
          gold: "Prices are on the shelves. Haggling's allowed. I'll win.",
          help: [
            "Alley's north to the square. Shop's closed on the first day of the month.",
            "For medicine, ask me. For trouble, ask Branfin. For riddles, the sage. For silence, the smith."
          ],
          where: "You're in my shop. The door's behind you. Try not to knock anything over.",
          road: "East gate to the road. East past the road to the land proper. Stay off the tomb path.",
        }
      }
    }
  },

  // --------------------------------------------------------------------
  // OLD WOMAN — quiet grief. Tied to the peak and the cellar key.
  // --------------------------------------------------------------------
  {
    id: "old_woman",
    name: "the old woman",
    desc: "Tiny, stooped, eyes bright as river stones. Flour on the cuffs of her shawl.",
    room: "cottage_ext",
    hp: 20,
    attack: 1,
    defense: 2,
    brain: {
      type: "scripted",
      params: {
        firstGreeting: [
          "*looks up from scattering grain*",
          "Oh. A visitor. You'll not find anything worth taking, but you're welcome all the same.",
          "Mind the chickens."
        ],
        greeting: [
          "*smiles, slow*",
          "You again. Sit if you like. I've no chair, but the step's dry."
        ],
        topicsHint: "Ask about the key, the road, the peak, my son, the chickens, or the garden.",
        fallback: [
          "*tilts her head*\nHm. I've forgotten more than I remember, dear.",
          "Perhaps. Perhaps not. Ask me about the key or the garden, I'm better on those."
        ],
        farewell: [
          "*pats your hand*",
          "Walk well, dear."
        ],
        ambient: [
          "*scatters grain for the chickens*",
          "*sighs, watching the road*",
          "*hums a tune, old and slow*",
          "*smiles at nothing in particular*"
        ],
        ambient_every: 22,
        dialogue: {
          key: [
            "*frowns*\nI lost the key to the cellar a fortnight past. Brass, warm-colored.",
            "If you come across it, I'd be grateful. Honey for your trouble, and thanks.",
            "It was in my apron. Then it wasn't. That's how those things go."
          ],
          brass: "That's it, yes. Warm to the touch. Always was.",
          cellar: "Bolted, below the kitchen. Nothing in it that matters. But I'd like the key back, still.",
          road: [
            "The road east runs to the meadow. The meadow goes further than it looks.",
            "Mira's often there, hood up, bow quiet. She was friends with my boy."
          ],
          peak: [
            "*stills*\nMy son went up the peak.\nHe did not come down."
          ],
          son: [
            "*looks down at her hands*\nHe was nineteen. Ranger, he wanted to be. Like Saro.\nHe went up at dawn. Said he'd be back for supper. That was four winters ago."
          ],
          mira: [
            "Mira was his friend. She still comes by on spring evenings and sits.",
            "She doesn't speak of him. I don't ask her to."
          ],
          saro: "He was there when my son wanted to learn tracks. Patient man. Too patient, some days.",
          branfin: "The innkeeper's a good sort. Mira's his girl — she has his eyes and her mother's steel.",
          garden: [
            "Root and leaf. I sell the root to Branfin for the stew. The leaf I keep.",
            "*points at a small patch by the cottage wall*\nBlue flowers there. Don't pick them. They make sleep."
          ],
          flowers: "The blue ones. Sleep-flowers. I grew them for my boy when he was small and wouldn't settle.",
          garden_help: "Pull weeds if you've a mind. I'll owe you a meal.",
          chickens: [
            "*smiles*\nThere are four. Henrietta's the bold one. The rest I don't bother naming.",
            "They keep the beetles off the cabbage. I keep the fox off them. We have an arrangement."
          ],
          home: "Born in this cottage. I expect I'll go from it too. That's a good life, mostly.",
          rat: "I've none. The fox keeps them off. Also Henrietta — she's fearless.",
          cottage: "Thatched, small, warm in winter. The loft is where my son slept.",
          sage: [
            "A kind man in his own way. Don't hold his riddles against him.",
            "He told my boy once, 'The mountain keeps what it's given.' I didn't understand then. I do now."
          ],
          help: "Ask me things small, I'm best at those. The key, the garden, the chickens. The rest I've mostly forgotten.",
          inn: "Branfin's a good man. Stew's worth the copper. His father's too, before him.",
          shop: "Adela sells herbs. The pale-green ones grow on the slope — you can get them free, if you don't mind the walk.",
        }
      }
    }
  },

  // --------------------------------------------------------------------
  // GORIM IRONFOOT — wandering sword-for-hire.  Blunt, direct, warm-ish.
  // --------------------------------------------------------------------
  {
    id: "player_gorim",
    name: "Gorim Ironfoot",
    desc: "A stocky traveler in a patched leather coat. Sword at hip, dust on the boots.",
    room: "village_square",
    hp: 35,
    brain: {
      type: "wanderer",
      params: {
        move_every: 10,
        chat_every: 14,
        engage_for: 30,
        firstGreeting: [
          "*looks you up and down, not unkindly*",
          "Well met. You've the look of fresh road about you.",
          "Gorim Ironfoot. Not for hire today, but I'll point you at the inn if you're thirsty."
        ],
        greeting: [
          "*nods*",
          "You again. Walk well?"
        ],
        topicsHint: "Ask about rats, the tomb, the smith, the peak, or where to find something.",
        farewell: [
          "*claps your shoulder*",
          "Luck to you. Mind the cellar rats."
        ],
        fallback: [
          "Couldn't tell you. I'm a sword, not a scholar.",
          "Not my field. Ask Adela at the shop — she keeps a better library than God."
        ],
        lines: [
          "Anyone seen the innkeeper's daughter?",
          "Gold for a decent blade.",
          "Cleared the cellar rats last week. Easy work.",
          "The tomb is a bad idea. I am saying this for you, free.",
          "*stretches a shoulder*"
        ],
        dialogue: {
          rat: [
            "Rats in the cottage cellar, rats in the inn cellar. Whole village is lousy with them.",
            "Fair pay if you clear them. Ask Branfin — he stood me stew for a dozen.",
            "Little bastards bite. Wear boots."
          ],
          rats: [
            "Cottage cellar and inn cellar are both thick with them.",
            "Not dangerous one at a time. Don't get swarmed."
          ],
          tomb: [
            "*spits*\nThe wight in there's killed better than you or me.",
            "I'll say it plain: turn around if you have any sense.",
            "If you go — go armed, and go after sleep. Not before."
          ],
          wight: [
            "Sword won't be enough. Better men tried.",
            "I went once. Didn't go in. Didn't regret that."
          ],
          inn: "The Pewter Mug. Branfin's fair, if you don't mind the ribbing. Stew's worth the copper.",
          branfin: "Good innkeeper. Worries about his girl. Who wouldn't.",
          peak: [
            "Went halfway once. The wolves in the pass turned me around.",
            "Saro says there's one wolf up there now, hunting alone. Don't go alone yourself."
          ],
          sword: [
            "Smith's good work if you can catch him in. Rusty one in the hut'll serve if you've nothing.",
            "A sword is only as brave as the hand. Don't flatter yourself with the steel."
          ],
          smith: "Halvard. Quiet man. Leave coin on the anvil if you take a blade.",
          halvard: "Widower. Keeps to himself. I respect it.",
          help: [
            "Gate's east, foothills north of the road, meadow east past that.",
            "If you want trouble: tomb south, cave behind the waterfall, goblin at the hunter's hut.",
            "If you want ale: south through the square to the Mug."
          ],
          where: "Village square. Smithy north, inn south, shop west through the alley, gate east.",
          mira: [
            "Branfin's girl. Wayfarer, she calls herself. Tall, green cloak, bow.",
            "She's out in the meadow most days. Doesn't like to come home."
          ],
          daughter: "Branfin's? Mira. Ask her yourself. She's kinder than she looks.",
          sage: "Riddles. I've no patience for him, but he's not wrong often. Just unhelpful.",
          gold: [
            "Fair work for fair coin. Two silver clears the rats. Tomb is not for coin.",
            "Keep your purse close at the shop. Adela counts twice."
          ],
          name: "Gorim Ironfoot. Second son of a miner. For what that's worth.",
          self: "Sword-for-hire. Between jobs. Between homes, most days.",
          goblin: [
            "Lives at the hunter's hut now. Small, quick, nasty.",
            "Hunter's knife is still in there. Mind the door when you open it."
          ],
          cave: "Bats. Something past the bats. Saro says a nest. I'd rather not know.",
          wolf: "One above the pass. Alone wolves are the worst kind. They've nothing to lose.",
        }
      }
    }
  },

  // --------------------------------------------------------------------
  // MIRA — Branfin's runaway daughter. Observant, slightly playful, careful.
  // --------------------------------------------------------------------
  {
    id: "player_mira",
    name: "Mira the Wayfarer",
    desc: "A slim figure in a green cloak, bow across her back. Watches the road like it's saying something.",
    room: "east_meadow",
    hp: 30,
    brain: {
      type: "wanderer",
      params: {
        move_every: 9,
        chat_every: 11,
        engage_for: 30,
        firstGreeting: [
          "*turns her head, quiet*",
          "Oh — hello. Didn't hear you come up.",
          "I'm Mira. Walk softly and the meadow talks back."
        ],
        greeting: [
          "*smiles, small*",
          "You again. Sit if you like — the grass won't mind."
        ],
        topicsHint: "Ask about the glade, the brook, the sage, the peak, the goblin — or my father.",
        farewell: [
          "*touches two fingers to her brow*",
          "Walk softly."
        ],
        fallback: [
          "*considers*\nI don't know that one. Try the sage — he knows half, and the other half he makes up.",
          "Not my knowing. Ask Adela — she keeps the book on every rumor that passes through."
        ],
        lines: [
          "*hums a tune*",
          "The brook runs full today.",
          "The peak is not for tonight.",
          "Heard the goblin is back at the hut.",
          "*watches a hawk, tracks it south*"
        ],
        dialogue: {
          brook: [
            "Just east of the glade. Trout are thick this year.",
            "Water's cold — feet numb in a minute. Worth it, though."
          ],
          trout: "Fat and lazy. I'd lend you a line, but I've only the one.",
          glade: [
            "Follow the meadow east. Quiet place. The sage keeps to it.",
            "The light's green there — all beech. Good for thinking."
          ],
          sage: [
            "The Sage of the Hollow. He speaks in riddles more than answers.",
            "Still worth a visit. He answers the question you should've asked.",
            "I go sometimes, when I can't think straight."
          ],
          peak: [
            "*looks west*\nNot the peak. Not today.",
            "The wind up there does things to your head. It called my friend up once. He didn't come back."
          ],
          father: [
            "*goes still*\nBranfin. The innkeeper.\nHe's a good man. I'm not ready to be his daughter again.\nIf you see him — tell him I'm well. Don't say I look tired."
          ],
          branfin: [
            "My father.",
            "I love him. I don't want to run the inn. Both can be true."
          ],
          daughter: [
            "*almost laughs*\nYou've been talking to my father.\nTell him I'm well. Don't tell him I look tired."
          ],
          inn: "The Pewter Mug. My father's inn. I grew up in it. I don't go back often.",
          goblin: [
            "Small, green, full of teeth. It's at the hunter's hut now.",
            "The hunter's knife is still inside. If you can reach it first, you'll have a better time than the goblin did with the last fellow."
          ],
          hunter: "The hunter's been gone a month. I've a bad feeling. I've said as much to Saro.",
          saro: [
            "Ranger. Keeps the lower slopes. Good man, few words.",
            "He can see tracks I can't. It's maddening, and useful."
          ],
          bow: [
            "Yew. Old one. Not for sale.",
            "*runs a thumb along the string*\nMy mother's. She's the one who taught me how to see."
          ],
          pond: "South of the meadow. Heron lives there. Pretends to be invisible. He's bad at it.",
          heron: [
            "*laughs softly*\nHe stands very still and thinks it's enough. It is, for fish. Not for me.",
          ],
          rat: "Rats are a town problem. Ask Gorim or Branfin.",
          tomb: "I don't go in. I'd rather not tell you about it. Saro would be the one to ask.",
          wight: "I know better than to wake it. So should you.",
          cave: "Behind the waterfall. I don't like small dark places. No.",
          self: "Wayfarer. A name I gave myself the day I stopped going home.",
          name: "Mira. If my father's said anything, know that he's mostly right about me.",
          help: [
            "Meadow's where I am most days. Brook east, glade east, pond south.",
            "Want the road? West. Want trouble? North to the foothills, south to the tomb.",
          ],
          where: "A broad meadow. Wildflowers. Quiet. It'll do.",
        }
      }
    }
  },

  // --------------------------------------------------------------------
  // SARO — nearly silent ranger. Few words, each one load-bearing.
  // --------------------------------------------------------------------
  {
    id: "player_saro",
    name: "Saro the Ranger",
    desc: "Tall, quiet, a hawk-feather through his braid. Walks like he doesn't want the ground to know.",
    room: "lower_foothills",
    hp: 32,
    brain: {
      type: "wanderer",
      params: {
        move_every: 12,
        chat_every: 16,
        engage_for: 30,
        firstGreeting: [
          "*nods slowly*",
          "Traveler.",
          "*pauses, as if listening*\nSpeak softer on these slopes."
        ],
        greeting: [
          "*nods*",
          "Back up here."
        ],
        topicsHint: "Ask about wolves, tracks, the pass, the cave, the peak.",
        farewell: [
          "*raises a hand*",
          "Go well."
        ],
        fallback: [
          "*shakes his head*",
          "Wouldn't know."
        ],
        lines: [
          "Tracks in the scree. Fresh.",
          "Wolf. Upslope.",
          "Keep low at the pass.",
          "*nods at something downslope*"
        ],
        dialogue: {
          wolf: [
            "One. Maybe two. Dens above the pass.",
            "Alone wolf. The worst kind.",
            "Don't go up without steel. And not alone."
          ],
          track: [
            "Scree shifts. I read what it tells.",
            "Today: wolf. One traveler — you. Nothing else."
          ],
          tracks: [
            "Fresh. Wolf, paw the size of my palm.",
            "Going up, not down. Means it hasn't fed yet."
          ],
          pass: [
            "Narrow. Loud with wind.",
            "If you hear anything else, turn around."
          ],
          peak: [
            "Been once.",
            "Don't ask.",
            "No one goes twice."
          ],
          cave: [
            "Behind the falls.",
            "Bats. Nest past that. Don't wake it."
          ],
          hunter: [
            "*goes still*",
            "Gone a month. Shouldn't be.",
            "If you find the knife in the hut, bring it back. I'll know what to do."
          ],
          goblin: [
            "At the hut. Small. Fast. Stabs above the knee.",
            "Knife's still inside. Grab it first."
          ],
          mira: "Branfin's girl. Listens. Worth listening back.",
          father: "Hers? The innkeeper. Fair man.",
          branfin: "Good house. Good stew.",
          old: [
            "*breathes slowly*\nHer son went up the peak. Was with me the day he asked to learn tracks.\nI wasn't with him the day he went."
          ],
          son: [
            "*goes quiet*\nHe was a good lad. Eager.\nThe mountain keeps what it's given."
          ],
          bow: "Carry one. Prefer the knife. Close work's honest.",
          sword: "Halvard's work. Better than mine would be.",
          smith: "Halvard. Leave coin on the anvil.",
          sage: [
            "Speaks in riddles.",
            "Most of them come true. Eventually."
          ],
          where: "Lower foothills. Road's south.",
          help: [
            "South to the road.",
            "North climbs. Pass is loud. Peak is not for today.",
            "West to the hunter's hut — quiet of late."
          ],
          self: "Saro. Just Saro.",
          name: "Saro.",
        }
      }
    }
  },

  // --------------------------------------------------------------------
  // SAGE OF THE HOLLOW — cryptic, answers sideways. Uses openclaw_demo brain.
  // Static-ish but the content reads oracular.
  // --------------------------------------------------------------------
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
        act_every: 7
      }
    }
  }
];
