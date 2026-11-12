// Edit these values to run your own show. Everything on the page reads from here.
window.SHOW_CONFIG = {
  showName: "Gamefowl Pro Online Conformation Show",
  year: 2027,
  contactEmail: "",          // shown in the Contact section when set
  youtubeUrl: "",            // live judging channel or playlist
  sponsorUrl: "",            // payment/donation link for sponsors (Stripe, PayPal...)
  entryFee: "Free",

  // Show schedule (edit freely; times shown as written)
  dates: [
    { date: "May 1",  text: "Entries open" },
    { date: "June 1", text: "Free entries close — late entries accepted for a fee" },
    { date: "June 8", text: "No more entries accepted" },
    { date: "June 12", text: "Youth Stag & Pullet judging — 10:30 AM CST (live)" },
    { date: "June 15", text: "Open Stag & Pullet judging — 1:00 PM CST (live)" },
    { date: "June 19", text: "Youth Cock & Hen judging — 10:30 AM CST (live)" },
    { date: "June 22", text: "Open Cock & Hen judging — 1:00 PM CST (live)" },
    { date: "June 26", text: "Fan Show voting closes" },
    { date: "July",   text: "Results posted and awards mailed" }
  ],

  // Judges: leave name empty to show "To be announced"
  judges: [
    { cls: "Open Cock & Hen", name: "", bio: "" },
    { cls: "Open Stag & Pullet", name: "", bio: "" },
    { cls: "Youth Divisions", name: "", bio: "" },
    { cls: "Fan Show", name: "Everyone can vote", bio: "Every visitor gets one vote per bird." }
  ],

  // Award tiers offered to sponsors
  awards: [
    { name: "Best in Class", gets: "Rosette + certificate", price: "$25" },
    { name: "Champion / Reserve Champion", gets: "Rosette, certificate + plaque", price: "$50" },
    { name: "Best of Breed / Line", gets: "Rosette", price: "$10" },
    { name: "Cash award", gets: "Check goes to the exhibitor", price: "Any amount" }
  ]
};
