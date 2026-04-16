import type { Room } from "../engine/world";

// Exits use short-form keys (n/s/e/w/u/d); the loader normalizes.
interface RoomSpec extends Omit<Room, "items"> {
  items?: string[];
}

export const ROOMS: RoomSpec[] = [
  {
    id: "narrow_road",
    name: "A Narrow Road",
    desc: "You are on a narrow road between The Land and the foothills of the Great Mountains. To the north and south are the small foothills of a pair of majestic mountains, with a large wall running round. To the west the road continues, where in the distance you can see a thatched cottage opposite an ancient cemetery.",
    exits: { n: "trail_fork", s: "eastern_slope", w: "path_west", e: "east_meadow" },
  },
  {
    id: "path_west",
    name: "The Road, Continuing West",
    desc: "The road runs on, rutted and dusty. To the north, a thatched cottage sits in a patch of well-kept garden; to the south, the low wall of an ancient cemetery. The road continues west toward a stone gate.",
    exits: { e: "narrow_road", n: "cottage_ext", s: "cemetery_gate", w: "village_gate" },
  },
  {
    id: "cottage_ext",
    name: "Outside a Thatched Cottage",
    desc: "A small thatched cottage, its walls whitewashed and its door painted a faded red. Chickens scratch at the step. The door stands ajar.",
    exits: { s: "path_west", e: "cottage_interior" },
    items: ["apple"],
  },
  {
    id: "cottage_interior",
    name: "Inside the Cottage",
    desc: "A warm, low-ceilinged room. A kettle sits on the hob; the smell of bread lingers. A trapdoor in the floor stands bolted with a heavy iron ring.",
    exits: { w: "cottage_ext", d: "wine_cellar" },
    items: ["loaf", "brass_key", "hearth"],
  },
  {
    id: "wine_cellar",
    name: "The Wine Cellar",
    desc: "Down the creaking ladder, the air cools. Casks of wine line the walls, and cobwebs curtain the beams. Something small skitters in the dark.",
    exits: { u: "cottage_interior" },
  },
  {
    id: "cemetery_gate",
    name: "The Cemetery Gate",
    desc: "A rusted iron gate stands open. Beyond it, row upon row of weathered gravestones tilt in the damp grass. Crows call from a stand of yew.",
    exits: { n: "path_west", s: "old_cemetery" },
  },
  {
    id: "old_cemetery",
    name: "The Ancient Cemetery",
    desc: "Mist clings to the ground. The graves are centuries old; lichen has made most of the names unreadable. A dark stone tomb stands to the west.",
    exits: { n: "cemetery_gate", w: "tomb" },
    items: ["gravestone"],
  },
  {
    id: "tomb",
    name: "An Ancient Tomb",
    desc: "The stone door of the tomb is cracked open, just wide enough to edge through. Cold air breathes out. Something rustles at the back.",
    exits: { e: "old_cemetery" },
  },
  {
    id: "village_gate",
    name: "The Village Gate",
    desc: "Two blunt towers of grey stone flank a heavy wooden gate, propped open with an iron peg. Beyond, you can hear hammers and conversation.",
    exits: { e: "path_west", w: "village_square" },
  },
  {
    id: "village_square",
    name: "The Village Square",
    desc: "A small, tidy square. A stone well sits at its center. Smoke curls up from a smithy to the north. To the south, a painted sign shows a pewter mug; to the west, an alley leads deeper into the village.",
    exits: { e: "village_gate", n: "smithy", s: "inn_ext", w: "shop_entry" },
    items: ["well"],
  },
  {
    id: "smithy",
    name: "The Village Smithy",
    desc: "The forge is lit and roaring, though no smith stands at the anvil. Tools hang in neat rows on pegs. A half-finished blade cools in a bucket of black water.",
    exits: { s: "village_square" },
  },
  {
    id: "inn_ext",
    name: "Outside the Pewter Mug",
    desc: "A rambling two-storey inn, its sign creaking lightly. Laughter leaks out from the shuttered windows, along with the smell of stew.",
    exits: { n: "village_square", e: "inn_common" },
  },
  {
    id: "inn_common",
    name: "The Common Room",
    desc: "A warm, low-beamed room. Long tables, a roaring fire, and a bar at the far end manned by a barrel-shaped innkeeper. A trapdoor behind the bar leads down to the cellar.",
    exits: { w: "inn_ext", d: "inn_cellar" },
    items: ["loaf"],
  },
  {
    id: "inn_cellar",
    name: "The Inn Cellar",
    desc: "A cramped cellar full of barrels and crates. The air is sour-sweet with old ale. Something has been pushing the crates around.",
    exits: { u: "inn_common" },
  },
  {
    id: "shop_entry",
    name: "A Narrow Alley",
    desc: "A crooked alley between leaning houses. A door at the south end has a small painted sign: SUNDRIES.",
    exits: { e: "village_square", s: "merchant_shop" },
  },
  {
    id: "merchant_shop",
    name: "The Merchant's Shop",
    desc: "The shop smells of leather and dried herbs. Shelves run floor to ceiling, packed with oddments. A ledger sits open on the counter.",
    exits: { n: "shop_entry" },
  },
  {
    id: "trail_fork",
    name: "A Fork in the Trail",
    desc: "The foothills begin here. The trail forks: one branch climbs north toward the lower slopes; the other runs west into a small cleared glade where a hunter's hut leans against a boulder.",
    exits: { s: "narrow_road", n: "lower_foothills", w: "hunters_hut" },
  },
  {
    id: "hunters_hut",
    name: "A Hunter's Hut",
    desc: "A lean-to of rough timbers. A hide is stretched on a frame; arrowheads lie on an oilcloth. The hunter is out.",
    exits: { e: "trail_fork" },
    items: ["iron_dagger"],
  },
  {
    id: "lower_foothills",
    name: "The Lower Foothills",
    desc: "The trail climbs through scrub and scree. Crickets sing in the warm stones. Ahead, the path rises to a broad crest.",
    exits: { s: "trail_fork", n: "foothills_crest" },
  },
  {
    id: "foothills_crest",
    name: "The Foothills Crest",
    desc: "The crest of a rolling hill. From here you can see the whole valley below — the road, the cottage, the cemetery, the village. A side-trail cuts east toward the sound of falling water.",
    exits: { s: "lower_foothills", n: "rocky_trail", e: "waterfall" },
  },
  {
    id: "rocky_trail",
    name: "The Rocky Trail",
    desc: "The trail narrows and steepens. Loose scree shifts underfoot. A cold wind comes down from the peaks.",
    exits: { s: "foothills_crest", n: "upper_foothills" },
  },
  {
    id: "upper_foothills",
    name: "The Upper Foothills",
    desc: "A high shoulder of the mountain. The air is thin and sharp. A stone cairn marks the path upward.",
    exits: { s: "rocky_trail", u: "mountain_pass" },
  },
  {
    id: "mountain_pass",
    name: "A Mountain Pass",
    desc: "A narrow defile between two black cliffs. Wind howls through it like a held breath. The path continues up toward the peak.",
    exits: { d: "upper_foothills", u: "mountain_peak" },
  },
  {
    id: "mountain_peak",
    name: "The Mountain Peak",
    desc: "The roof of the world. Snow lies in drifts between dark slabs of stone. Far below, the valley looks impossibly small.",
    exits: { d: "mountain_pass" },
    items: ["parchment"],
  },
  {
    id: "waterfall",
    name: "Beside a Waterfall",
    desc: "A ribbon of cold water drops from a ledge above and spatters into a mossy pool. Behind the falls, you can just make out a dark opening in the cliff.",
    exits: { w: "foothills_crest", e: "hidden_cave" },
  },
  {
    id: "hidden_cave",
    name: "A Hidden Cave",
    desc: "Behind the water, the cave runs back further than you can see. The walls are cold and smooth. Something has made a nest here.",
    exits: { w: "waterfall" },
    items: ["healing_herb", "tarnished_coin"],
  },
  {
    id: "eastern_slope",
    name: "The Eastern Slope",
    desc: "A grassy slope runs down from the road. Sheep trails meander through the low heather. In the distance, a stand of birches.",
    exits: { n: "narrow_road" },
    items: ["healing_herb"],
  },
  {
    id: "east_meadow",
    name: "A Broad Meadow",
    desc: "Wildflowers paint the grass yellow and blue. The road is only a pale line behind you. To the east, the ground dips into a glade.",
    exits: { w: "narrow_road", e: "glade", s: "pond" },
  },
  {
    id: "glade",
    name: "A Quiet Glade",
    desc: "Tall beeches filter the light to green. The ground is soft with old leaves. A bright brook runs through the eastern side.",
    exits: { w: "east_meadow", e: "brook" },
  },
  {
    id: "brook",
    name: "A Clear Brook",
    desc: "Cold water runs fast over white stones. Trout dart in the shadows. The glade ends here.",
    exits: { w: "glade" },
  },
  {
    id: "pond",
    name: "A Still Pond",
    desc: "A small, perfectly still pond ringed with cattails. A heron stands motionless in the shallows, pretending you cannot see it.",
    exits: { n: "east_meadow" },
  },
];
