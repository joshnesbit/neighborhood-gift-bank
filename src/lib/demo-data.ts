import type { Person, Note, Gift, Connection, NotePerson, NoteStructured } from "./database.types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split("T")[0];
}

let idCounter = 1;
function id() { return `demo-${idCounter++}`; }

// --- People ---
const marcusId = id(), lilaId = id(), samId = id(), dorothyId = id();
const rajId = id(), mariaId = id(), jamesId = id();

const demoPeople: Person[] = [
  { id: marcusId, name: "Marcus Williams", aliases: ["Marcus"], where_they_are: "30th and Judah, yellow house on the corner", first_met_at: dateStr(120), last_seen_at: daysAgo(3), notes_count: 3, created_at: daysAgo(120), updated_at: daysAgo(3) },
  { id: lilaId, name: "Lila Chen", aliases: ["Lila"], where_they_are: "runs the community garden on 31st", first_met_at: dateStr(90), last_seen_at: daysAgo(8), notes_count: 3, created_at: daysAgo(90), updated_at: daysAgo(8) },
  { id: samId, name: "Sam Torres", aliases: ["Sam", "Sammy"], where_they_are: "above the bodega on Noriega", first_met_at: dateStr(60), last_seen_at: daysAgo(15), notes_count: 2, created_at: daysAgo(60), updated_at: daysAgo(15) },
  { id: dorothyId, name: "Dorothy Washington", aliases: ["Dorothy", "Miss Dorothy"], where_they_are: "been on the block since 1978", first_met_at: dateStr(180), last_seen_at: daysAgo(14), notes_count: 2, created_at: daysAgo(180), updated_at: daysAgo(14) },
  { id: rajId, name: "Raj Patel", aliases: ["Raj"], where_they_are: "owns the corner store on Irving", first_met_at: dateStr(45), last_seen_at: daysAgo(1), notes_count: 1, created_at: daysAgo(45), updated_at: daysAgo(1) },
  { id: mariaId, name: "Maria Santos", aliases: ["Maria"], where_they_are: "three doors down from Marcus", first_met_at: dateStr(30), last_seen_at: daysAgo(5), notes_count: 1, created_at: daysAgo(30), updated_at: daysAgo(5) },
  { id: jamesId, name: "James O'Brien", aliases: ["James", "Jim"], where_they_are: "the blue duplex, ground floor", first_met_at: dateStr(75), last_seen_at: daysAgo(42), notes_count: 1, created_at: daysAgo(75), updated_at: daysAgo(42) },
];

// --- Notes ---
const n1 = id(), n2 = id(), n3 = id(), n4 = id(), n5 = id();
const n6 = id(), n7 = id(), n8 = id(), n9 = id(), n10 = id();

const demoNotes: Note[] = [
  { id: n1, raw_text: "Ran into Marcus at the corner store today. He was buying soil for his backyard. Turns out he used to teach woodworking at the high school before he retired — misses it a lot. Said his kid just left for college and the house feels quiet. He mentioned Lila at the garden might need help building raised beds. I should introduce them.", structured: { people: [{ matched_id: marcusId, name: "Marcus Williams", gifts: [{ text: "used to teach woodworking at the high school", kind: "hand" }, { text: "would teach woodworking again", kind: "teachable" }, { text: "loves teaching, misses it since retirement", kind: "heart" }], pointed_to: ["Lila"] }], follow_ups: ["Introduce Marcus to Lila about building raised beds"] } as NoteStructured, recorded_at: daysAgo(3), created_at: daysAgo(3) },
  { id: n2, raw_text: "Spent time at the community garden with Lila. She's been running it for four years now, mostly by herself. Grows tomatoes, squash, herbs. She dreams of turning the empty lot next door into a kids' garden where neighborhood children can learn to grow food. She knows everything about who lives on every block between 28th and 33rd.", structured: { people: [{ matched_id: lilaId, name: "Lila Chen", gifts: [{ text: "runs the community garden, four years", kind: "hand" }, { text: "grows tomatoes, squash, herbs", kind: "hand" }, { text: "loves growing things and being in the garden", kind: "heart" }, { text: "knows who lives on every block from 28th to 33rd", kind: "head" }, { text: "dreams of a kids' garden on the empty lot next door", kind: "dream" }] }] } as NoteStructured, recorded_at: daysAgo(8), created_at: daysAgo(8) },
  { id: n3, raw_text: "Sam came by the garden while I was talking to Lila. He's 17, quiet but sharp. He's been teaching himself guitar from YouTube and wants to play at the block party this summer. His mom works nights so he's on his own a lot. Lila said she'd love to have him help out at the garden — he seemed interested.", structured: { people: [{ matched_id: samId, name: "Sam Torres", gifts: [{ text: "teaching himself guitar from YouTube", kind: "hand" }, { text: "wants to play guitar at the block party", kind: "dream" }, { text: "quiet but sharp, self-directed learner", kind: "head" }] }, { matched_id: lilaId, name: "Lila Chen", gifts: [], pointed_to: ["Sam"] }] } as NoteStructured, recorded_at: daysAgo(21), created_at: daysAgo(21) },
  { id: n4, raw_text: "Miss Dorothy flagged me down from her porch. She wanted to tell me about the pecan pie she used to make for the church bake sale — her grandmother's recipe from Alabama. She said she'd teach anyone who wanted to learn. She also told me stories about what this block was like in the 1980s, who lived where, which houses burned down and got rebuilt. Living history.", structured: { people: [{ matched_id: dorothyId, name: "Dorothy Washington", gifts: [{ text: "makes pecan pie from her grandmother's Alabama recipe", kind: "hand" }, { text: "would teach anyone to bake her pecan pie", kind: "teachable" }, { text: "living history of the block since 1978", kind: "head" }, { text: "loves telling stories about the neighborhood", kind: "heart" }] }] } as NoteStructured, recorded_at: daysAgo(14), created_at: daysAgo(14) },
  { id: n5, raw_text: "Stopped by Raj's store for coffee. He knows every kid on the block by name. He told me he's been thinking about putting a little free library outside the store — has a bunch of kids' books his daughters outgrew. He also mentioned Marcus comes in every morning and they talk about cricket.", structured: { people: [{ matched_id: rajId, name: "Raj Patel", gifts: [{ text: "knows every kid on the block by name", kind: "head" }, { text: "wants to start a little free library outside his store", kind: "dream" }, { text: "loves connecting with the kids and families on the block", kind: "heart" }], pointed_to: ["Marcus"] }] } as NoteStructured, recorded_at: daysAgo(1), created_at: daysAgo(1) },
  { id: n6, raw_text: "Maria was out front watering her plants. She moved here from Mexico City two years ago. She's a nurse but between jobs right now. She said she's been making tamales and giving them to neighbors — it's how she meets people. She dreams of starting a small catering business someday. She knows Marcus from church.", structured: { people: [{ matched_id: mariaId, name: "Maria Santos", gifts: [{ text: "nurse by training", kind: "hand" }, { text: "makes tamales and shares them with neighbors", kind: "hand" }, { text: "loves feeding people as a way to connect", kind: "heart" }, { text: "dreams of starting a small catering business", kind: "dream" }] }] } as NoteStructured, recorded_at: daysAgo(5), created_at: daysAgo(5) },
  { id: n7, raw_text: "James was sitting on his stoop reading. He's a retired electrician — worked commercial buildings for 30 years. He said he still does small jobs for neighbors when they ask. He seems lonely since his wife passed. He mentioned he used to coach Little League and misses being around kids.", structured: { people: [{ matched_id: jamesId, name: "James O'Brien", gifts: [{ text: "retired electrician, 30 years commercial", kind: "hand" }, { text: "still does small electrical jobs for neighbors", kind: "teachable" }, { text: "used to coach Little League, misses being around kids", kind: "heart" }, { text: "would love to coach or mentor kids again", kind: "dream" }] }] } as NoteStructured, recorded_at: daysAgo(42), created_at: daysAgo(42) },
  { id: n8, raw_text: "Marcus told me more today — he served in the Navy for 8 years before becoming a teacher. He speaks some Tagalog from his time stationed in the Philippines. He's worried about the empty storefronts on Irving and thinks a neighborhood skills swap could bring people together. He said Dorothy might be interested in teaching pie-making at something like that.", structured: { people: [{ matched_id: marcusId, name: "Marcus Williams", gifts: [{ text: "served 8 years in the Navy", kind: "head" }, { text: "speaks some Tagalog", kind: "head" }, { text: "dreams of a neighborhood skills swap to fill empty storefronts", kind: "dream" }], pointed_to: ["Dorothy"] }], follow_ups: ["Talk to Dorothy about teaching pie-making at a skills swap"] } as NoteStructured, recorded_at: daysAgo(10), created_at: daysAgo(10) },
  { id: n9, raw_text: "Second visit with Dorothy. She was crocheting on the porch. She makes blankets for new babies on the block — has done it for decades. She told me she's worried about James across the street, says he doesn't come out much anymore. She thinks he and Marcus would get along — they're both veterans.", structured: { people: [{ matched_id: dorothyId, name: "Dorothy Washington", gifts: [{ text: "crochets blankets for every new baby on the block", kind: "hand" }, { text: "deeply cares about neighbors' wellbeing", kind: "heart" }], pointed_to: ["James", "Marcus"] }], follow_ups: ["Check in on James", "Introduce James and Marcus — both veterans"] } as NoteStructured, recorded_at: daysAgo(28), created_at: daysAgo(28) },
  { id: n10, raw_text: "Lila showed me the new compost system she built. She's been talking to the city about getting a water hookup for the garden. She mentioned Sam has been coming by more often and is really good with the younger kids who visit. She thinks he'd be a great garden mentor for the summer program she's dreaming up.", structured: { people: [{ matched_id: lilaId, name: "Lila Chen", gifts: [{ text: "built a compost system for the garden", kind: "hand" }, { text: "navigating city bureaucracy for water hookup", kind: "head" }], pointed_to: ["Sam"] }, { matched_id: samId, name: "Sam Torres", gifts: [{ text: "good with younger kids at the garden", kind: "heart" }] }], follow_ups: ["Ask Sam if he'd want to mentor kids in a summer garden program"] } as NoteStructured, recorded_at: daysAgo(15), created_at: daysAgo(15) },
];

// --- Build gifts from notes ---
const demoGifts: Gift[] = [];
let giftCounter = 1;
for (const note of demoNotes) {
  if (!note.structured) continue;
  for (const person of (note.structured as NoteStructured).people) {
    for (const gift of person.gifts) {
      demoGifts.push({
        id: `gift-${giftCounter++}`,
        person_id: person.matched_id!,
        text: gift.text,
        kind: gift.kind,
        source_note_id: note.id,
        created_at: note.created_at,
      });
    }
  }
}

// --- Build note-people links ---
const demoNotePeople: NotePerson[] = [];
for (const note of demoNotes) {
  if (!note.structured) continue;
  const seen = new Set<string>();
  for (const person of (note.structured as NoteStructured).people) {
    if (person.matched_id && !seen.has(person.matched_id)) {
      demoNotePeople.push({ note_id: note.id, person_id: person.matched_id });
      seen.add(person.matched_id);
    }
  }
}

// --- Connections ---
const demoConnections: Connection[] = [
  { id: id(), from_person: marcusId, to_person: lilaId, reason: "Marcus mentioned Lila might need help building raised beds", source_note_id: n1, status: "suggested", created_at: daysAgo(3) },
  { id: id(), from_person: lilaId, to_person: samId, reason: "Lila wants Sam to help at the garden", source_note_id: n3, status: "introduced", created_at: daysAgo(21) },
  { id: id(), from_person: rajId, to_person: marcusId, reason: "Raj and Marcus talk cricket every morning at the store", source_note_id: n5, status: "done", created_at: daysAgo(1) },
  { id: id(), from_person: marcusId, to_person: dorothyId, reason: "Marcus thinks Dorothy would teach pie-making at a skills swap", source_note_id: n8, status: "suggested", created_at: daysAgo(10) },
  { id: id(), from_person: dorothyId, to_person: jamesId, reason: "Dorothy is worried about James, thinks he needs company", source_note_id: n9, status: "suggested", created_at: daysAgo(28) },
  { id: id(), from_person: dorothyId, to_person: marcusId, reason: "Dorothy thinks James and Marcus would get along — both veterans", source_note_id: n9, status: "suggested", created_at: daysAgo(28) },
  { id: id(), from_person: lilaId, to_person: samId, reason: "Lila thinks Sam would be a great garden mentor for kids", source_note_id: n10, status: "suggested", created_at: daysAgo(15) },
];

export const demo = {
  people: demoPeople,
  notes: demoNotes,
  gifts: demoGifts,
  notePeople: demoNotePeople,
  connections: demoConnections,
};
