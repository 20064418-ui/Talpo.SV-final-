/* eslint-disable */
// Código original de components/foro.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
/* =========================================================
   TRAVELER COMMUNITY / FORUM — UI LOGIC
   =========================================================
   Everything here is MOCK data (in-memory). In production, every
   function tagged "// TODO API:" would make a real fetch() call
   to your backend (Node/Express, Django, etc.), which would in
   turn run the SQL queries from schema.sql.
   ========================================================= */

/* ---------------------------------------------------------
   1) CURRENT USER (mock — would come from your auth system)
   --------------------------------------------------------- */
// Usuario real de InsForge (antes era un mock fijo)
const __me = __talapo.user();
const DEFAULT_AVATAR = "/assets/img/logos/logooriginal.png";
const CURRENT_USER = __me
  ? { id: __me.id, name: __me.name, avatarUrl: __me.avatar || DEFAULT_AVATAR }
  : { id: "guest", name: "Guest", avatarUrl: DEFAULT_AVATAR };

/* ---------------------------------------------------------
   2) DESTINATIONS (mirrors the `destinations` table in schema.sql)
   --------------------------------------------------------- */
const DESTINATIONS = [
  { id: 1, name: "Ruta de las Flores", department: "Sonsonate" },
  { id: 2, name: "Surf City – El Tunco", department: "La Libertad" },
  { id: 3, name: "Surf City – El Zonte", department: "La Libertad" },
  { id: 4, name: "Coatepeque Lake & Volcano", department: "Santa Ana" },
  { id: 5, name: "Suchitoto", department: "Cuscatlán" },
  { id: 6, name: "Joya de Cerén", department: "La Libertad" },
  { id: 7, name: "Costa del Sol", department: "La Paz" },
  { id: 8, name: "Perquín", department: "Morazán" },
  { id: 9, name: "Downtown San Salvador", department: "San Salvador" },
  { id: 10, name: "Los Chorros de la Calera", department: "Sonsonate" }
];

function getDestination(id) {
  return DESTINATIONS.find((d) => d.id === Number(id));
}

/* ---------------------------------------------------------
   3) SAMPLE POSTS (mock data — reflect `posts` + `comments`
      + `reactions` + `saved_posts` already joined for the UI)
   ---------------------------------------------------------
   NOTE ON LOCATION PHOTOS:
   - El Tunco (post-1): verified photo, it really is the iconic
     El Tunco rock at sunset (Unsplash, "playa el tunco" search).
   - The rest of the posts use fitting stock photos that were not
     individually verified to be that exact location.
     // EDIT HERE if you have your own or licensed photos of these
     // places — just replace the "imageUrl" value.
   --------------------------------------------------------- */
const DEMO_POSTS = [
  {
    id: "post-1",
    userId: "user-ana",
    authorName: "Ana Meléndez",
    authorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
    destinationId: 2,
    title: "The perfect sunset at El Tunco",
    body: "We got there around 4pm and grabbed a table at a restaurant right on the water. The sunset with the rock in the background was spectacular. 100% recommend going on a weekday to avoid the crowds.",
    imageUrl: "https://images.unsplash.com/photo-1626663082623-daed65c06061?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-24T18:30:00Z",
    reactions: { "user-carlos": "like", "user-fer": "love" },
    saved: ["user-fer"],
    comments: [
      {
        id: "c1",
        userId: "user-carlos",
        authorName: "Carlos R.",
        authorAvatar: "https://randomuser.me/api/portraits/men/54.jpg",
        body: "Looks amazing! Which restaurant was it?",
        createdAt: "2026-07-24T19:00:00Z",
        parentId: null
      },
      {
        id: "c2",
        userId: "user-ana",
        authorName: "Ana Meléndez",
        authorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
        body: "It's called Piedra Azul, right at the entrance to the beach.",
        createdAt: "2026-07-24T19:15:00Z",
        parentId: "c1"
      },
      {
        id: "c4",
        userId: "user-gabriela",
        authorName: "Gabriela Cruz",
        authorAvatar: "https://randomuser.me/api/portraits/women/21.jpg",
        body: "I went a month ago and the water was perfect for swimming 🌊",
        createdAt: "2026-07-24T20:05:00Z",
        parentId: null
      },
      {
        id: "c5",
        userId: "user-ana",
        authorName: "Ana Meléndez",
        authorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
        body: "Yes, it's way calmer in the morning than in the afternoon.",
        createdAt: "2026-07-24T20:20:00Z",
        parentId: "c4"
      },
      {
        id: "c6",
        userId: "user-mario",
        authorName: "Mario Chávez",
        authorAvatar: "https://randomuser.me/api/portraits/men/40.jpg",
        body: "Roughly how much did you spend for a weekend there?",
        createdAt: "2026-07-25T08:10:00Z",
        parentId: null
      },
      {
        id: "c7",
        userId: "user-fer",
        authorName: "Fernando Argueta",
        authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
        body: "We spent about $40 per person for the whole weekend, lodging included.",
        createdAt: "2026-07-25T08:40:00Z",
        parentId: "c6"
      }
    ]
  },
  {
    id: "post-2",
    userId: "user-fer",
    authorName: "Fernando Argueta",
    authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    destinationId: 5,
    title: "Suchitoto in one day: totally worth it",
    body: "We walked through the historic center, checked out the viewpoint, and ended up at Lake Suchitlán watching the herons. If you go, try the rice pupusas at the main square.",
    imageUrl: "https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-22T14:10:00Z",
    reactions: { "user-ana": "like" },
    saved: [],
    comments: [
      {
        id: "c8",
        userId: "user-sofia",
        authorName: "Sofía Reyes",
        authorAvatar: "https://randomuser.me/api/portraits/women/56.jpg",
        body: "Suchitoto is my favorite town, the food there is incredible.",
        createdAt: "2026-07-22T15:00:00Z",
        parentId: null
      },
      {
        id: "c9",
        userId: "user-camila",
        authorName: "Camila Torres",
        authorAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
        body: "Any boutique hotel recommendations there?",
        createdAt: "2026-07-22T16:30:00Z",
        parentId: null
      },
      {
        id: "c10",
        userId: "user-fer",
        authorName: "Fernando Argueta",
        authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
        body: "Tortuga Verde has a great lake view, that's where we stayed.",
        createdAt: "2026-07-22T17:00:00Z",
        parentId: "c9"
      }
    ]
  },
  {
    id: "post-3",
    userId: "user-carlos",
    authorName: "Carlos R.",
    authorAvatar: "https://randomuser.me/api/portraits/men/54.jpg",
    destinationId: 1,
    title: "Ruta de las Flores in October = pure magic",
    body: "Ataco, Apaneca, and Juayúa with the coffee flowers in full bloom. The cool climate up there makes the trip worth it on its own.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-20T09:45:00Z",
    reactions: { "user-ana": "love", "user-fer": "like" },
    saved: ["user-ana", "user-fer"],
    comments: [
      {
        id: "c3",
        userId: "user-fer",
        authorName: "Fernando Argueta",
        authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
        body: "We went in December and it was gorgeous too.",
        createdAt: "2026-07-20T10:00:00Z",
        parentId: null
      },
      {
        id: "c11",
        userId: "user-luis",
        authorName: "Luis Hernández",
        authorAvatar: "https://randomuser.me/api/portraits/men/18.jpg",
        body: "The food in Juayúa is worth it too, especially the weekend food festival.",
        createdAt: "2026-07-20T11:15:00Z",
        parentId: null
      },
      {
        id: "c12",
        userId: "user-roberto",
        authorName: "Roberto Peña",
        authorAvatar: "https://randomuser.me/api/portraits/men/85.jpg",
        body: "Can you get there by public transport or do you need a car?",
        createdAt: "2026-07-20T12:00:00Z",
        parentId: null
      },
      {
        id: "c13",
        userId: "user-carlos",
        authorName: "Carlos R.",
        authorAvatar: "https://randomuser.me/api/portraits/men/54.jpg",
        body: "There are direct buses from Sonsonate, but it's more convenient by car to get between the towns.",
        createdAt: "2026-07-20T12:30:00Z",
        parentId: "c12"
      }
    ]
  },
  {
    id: "post-4",
    userId: "user-sofia",
    authorName: "Sofía Reyes",
    authorAvatar: "https://randomuser.me/api/portraits/women/56.jpg",
    destinationId: 4,
    title: "Kayaking on Lake Coatepeque was the highlight of the trip",
    body: "We rented kayaks right on the shore and paddled out with the volcano as a backdrop the whole time. The water was warmer than we expected, and we stayed for sunset — the colors over the crater lake were unreal.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-18T16:20:00Z",
    reactions: { "user-camila": "love", "user-luis": "like" },
    saved: ["user-camila"],
    comments: [
      {
        id: "c14",
        userId: "user-camila",
        authorName: "Camila Torres",
        authorAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
        body: "Is it a long drive from San Salvador?",
        createdAt: "2026-07-18T17:00:00Z",
        parentId: null
      },
      {
        id: "c15",
        userId: "user-sofia",
        authorName: "Sofía Reyes",
        authorAvatar: "https://randomuser.me/api/portraits/women/56.jpg",
        body: "About an hour and a half, pretty easy day trip.",
        createdAt: "2026-07-18T17:20:00Z",
        parentId: "c14"
      }
    ]
  },
  {
    id: "post-5",
    userId: "user-mario",
    authorName: "Mario Chávez",
    authorAvatar: "https://randomuser.me/api/portraits/men/40.jpg",
    destinationId: 3,
    title: "Learned to surf at El Zonte in one weekend",
    body: "Took a two-hour lesson with a local instructor on Saturday morning and was catching small waves by the afternoon. El Zonte is a lot more low-key than El Tunco, and the beachfront coffee shops are great for resting between sessions.",
    imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-16T13:50:00Z",
    reactions: { "user-fer": "like" },
    saved: [],
    comments: [
      {
        id: "c16",
        userId: "user-gabriela",
        authorName: "Gabriela Cruz",
        authorAvatar: "https://randomuser.me/api/portraits/women/21.jpg",
        body: "How much was the lesson?",
        createdAt: "2026-07-16T14:10:00Z",
        parentId: null
      },
      {
        id: "c17",
        userId: "user-mario",
        authorName: "Mario Chávez",
        authorAvatar: "https://randomuser.me/api/portraits/men/40.jpg",
        body: "$25 for two hours, board rental included.",
        createdAt: "2026-07-16T14:30:00Z",
        parentId: "c16"
      }
    ]
  },
  {
    id: "post-6",
    userId: "user-gabriela",
    authorName: "Gabriela Cruz",
    authorAvatar: "https://randomuser.me/api/portraits/women/21.jpg",
    destinationId: 6,
    title: "The 'Pompeii of the Americas' is worth the detour",
    body: "Joya de Cerén is a small site but the guided tour makes it. Seeing an entire Mayan village preserved under volcanic ash, down to the ceramic pots still sitting on the floor, was surreal. Give yourself about an hour.",
    imageUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-14T11:05:00Z",
    reactions: { "user-ana": "like", "user-roberto": "like" },
    saved: ["user-roberto"],
    comments: [
      {
        id: "c18",
        userId: "user-luis",
        authorName: "Luis Hernández",
        authorAvatar: "https://randomuser.me/api/portraits/men/18.jpg",
        body: "Is it easy to combine with San Andrés in the same day?",
        createdAt: "2026-07-14T11:40:00Z",
        parentId: null
      },
      {
        id: "c19",
        userId: "user-gabriela",
        authorName: "Gabriela Cruz",
        authorAvatar: "https://randomuser.me/api/portraits/women/21.jpg",
        body: "Yes, they're close by, we did both in one morning.",
        createdAt: "2026-07-14T12:00:00Z",
        parentId: "c18"
      }
    ]
  },
  {
    id: "post-7",
    userId: "user-luis",
    authorName: "Luis Hernández",
    authorAvatar: "https://randomuser.me/api/portraits/men/18.jpg",
    destinationId: 7,
    title: "A relaxed weekend at Costa del Sol",
    body: "Calm, warm water and no big waves, so it's perfect if you're traveling with kids. We rented a beach club chair for the day and had fresh grilled fish for lunch right on the sand.",
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-12T15:30:00Z",
    reactions: { "user-sofia": "love" },
    saved: ["user-sofia"],
    comments: [
      {
        id: "c20",
        userId: "user-mario",
        authorName: "Mario Chávez",
        authorAvatar: "https://randomuser.me/api/portraits/men/40.jpg",
        body: "Good spot for a family trip then?",
        createdAt: "2026-07-12T16:00:00Z",
        parentId: null
      },
      {
        id: "c21",
        userId: "user-luis",
        authorName: "Luis Hernández",
        authorAvatar: "https://randomuser.me/api/portraits/men/18.jpg",
        body: "100%, way calmer than the surf beaches.",
        createdAt: "2026-07-12T16:15:00Z",
        parentId: "c20"
      }
    ]
  },
  {
    id: "post-8",
    userId: "user-roberto",
    authorName: "Roberto Peña",
    authorAvatar: "https://randomuser.me/api/portraits/men/85.jpg",
    destinationId: 8,
    title: "Perquín's war museum left us speechless",
    body: "The Museum of the Salvadoran Revolution has real weapons, radio equipment, and first-hand accounts from the civil war. Afterward we hiked part of the Ruta de Paz trail — the mountain air up there is a nice change from the coast.",
    imageUrl: "https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-10T10:15:00Z",
    reactions: { "user-carlos": "like", "user-ana": "like" },
    saved: [],
    comments: [
      {
        id: "c22",
        userId: "user-camila",
        authorName: "Camila Torres",
        authorAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
        body: "Is it a heavy visit emotionally?",
        createdAt: "2026-07-10T10:45:00Z",
        parentId: null
      },
      {
        id: "c23",
        userId: "user-roberto",
        authorName: "Roberto Peña",
        authorAvatar: "https://randomuser.me/api/portraits/men/85.jpg",
        body: "It is, but the guides (some are former combatants) explain everything really well.",
        createdAt: "2026-07-10T11:10:00Z",
        parentId: "c22"
      }
    ]
  },
  {
    id: "post-9",
    userId: "user-camila",
    authorName: "Camila Torres",
    authorAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
    destinationId: 9,
    title: "A walking tour through Downtown San Salvador's history",
    body: "Started at the National Palace, walked to the Metropolitan Cathedral, and ended up at Libertad Plaza. It's easy to do on foot in half a day, and the architecture is a mix of history you don't expect if you only picture the modern part of the city.",
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-08T09:20:00Z",
    reactions: { "user-fer": "like", "user-gabriela": "love" },
    saved: ["user-fer"],
    comments: [
      {
        id: "c24",
        userId: "user-mario",
        authorName: "Mario Chávez",
        authorAvatar: "https://randomuser.me/api/portraits/men/40.jpg",
        body: "Would you recommend going with a guide or just walking around on your own?",
        createdAt: "2026-07-08T09:50:00Z",
        parentId: null
      },
      {
        id: "c25",
        userId: "user-camila",
        authorName: "Camila Torres",
        authorAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
        body: "We went on our own and it was fine, there's a lot of information posted around the plaza.",
        createdAt: "2026-07-08T10:05:00Z",
        parentId: "c24"
      }
    ]
  },
  {
    id: "post-10",
    userId: "user-fer",
    authorName: "Fernando Argueta",
    authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    destinationId: 10,
    title: "Natural pools at Los Chorros de la Calera",
    body: "Cold, clear water straight from the mountain, and way fewer people than I expected on a Saturday. There's a small entrance fee and a couple of food stands nearby. Go early to get one of the shaded spots.",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80",
    createdAt: "2026-07-06T12:40:00Z",
    reactions: { "user-ana": "like" },
    saved: [],
    comments: [
      {
        id: "c26",
        userId: "user-luis",
        authorName: "Luis Hernández",
        authorAvatar: "https://randomuser.me/api/portraits/men/18.jpg",
        body: "How cold are we talking?",
        createdAt: "2026-07-06T13:00:00Z",
        parentId: null
      },
      {
        id: "c27",
        userId: "user-fer",
        authorName: "Fernando Argueta",
        authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
        body: "Cold enough that it takes a minute to get used to, but really refreshing once you're in.",
        createdAt: "2026-07-06T13:15:00Z",
        parentId: "c26"
      }
    ]
  }
];

// Con InsForge configurado el feed viene de la base de datos; sin backend se ve el demo.
let POSTS = __talapo.online ? [] : DEMO_POSTS;

/* ---------------------------------------------------------
   UI STATE
   --------------------------------------------------------- */
let currentSort = "recientes";
let pendingImageDataUrl = null; // vista previa local
let pendingImageFile = null;    // archivo real que se sube a InsForge Storage

/* ---------------------------------------------------------
   INSFORGE — tablas forum_posts, forum_comments, forum_reactions,
   forum_saves y bucket de Storage "forum-images"
   --------------------------------------------------------- */
const db = __talapo.db;

function rowToPost(r) {
  const reactions = {};
  (r.reactions || []).forEach((x) => { reactions[x.user_id] = x.type; });
  return {
    id: r.id,
    userId: r.user_id,
    authorName: r.author_name,
    authorAvatar: r.author_avatar || DEFAULT_AVATAR,
    destinationId: r.destination_id,
    title: r.title,
    body: r.body,
    imageUrl: r.image_url,
    createdAt: r.created_at,
    hidden: !!r.hidden,
    reactions,
    saved: (r.saves || []).map((x) => x.user_id),
    comments: (r.comments || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((c) => ({
        id: c.id, userId: c.user_id, authorName: c.author_name,
        authorAvatar: c.author_avatar || DEFAULT_AVATAR, body: c.body,
        createdAt: c.created_at, parentId: c.parent_id, hidden: !!c.hidden,
      })),
  };
}

async function loadPosts() {
  if (!__talapo.online) return;
  const feedList = document.getElementById("feedList");
  if (!POSTS.length) feedList.innerHTML = '<p class="forum-empty">Loading community posts…</p>';
  const { data, error } = await db.from("forum_posts")
    .select("*, comments:forum_comments(*), reactions:forum_reactions(user_id,type), saves:forum_saves(user_id)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[foro]", error);
    feedList.innerHTML = '<p class="forum-empty">The forum could not load. Check your connection and refresh.</p>';
    return;
  }
  POSTS = data.map(rowToPost);
  renderFeed();
}

function reportError(error, message) {
  console.error("[foro]", error);
  __talapo.toast(message || error.message || "Something went wrong", "error");
}

/* ---------------------------------------------------------
   4) IMAGE UPLOAD — MOCK VERSION
   ---------------------------------------------------------
   Here we just generate a base64 preview with FileReader and
   keep it in memory. That works for a demo, but storing a
   base64 data:// URL in the database is bad practice in
   production (it's heavy and doesn't cache well).

   // TODO API: replace this block with a real upload:
   //
   //   async function uploadImage(file) {
   //     const formData = new FormData();
   //     formData.append("file", file);
   //     formData.append("upload_preset", "talapo_forum"); // Cloudinary
   //     const res = await fetch(
   //       "https://api.cloudinary.com/v1_1/<CLOUD_NAME>/image/upload",
   //       { method: "POST", body: formData }
   //     );
   //     const data = await res.json();
   //     return data.secure_url; // <- this is what gets saved in posts.image_url
   //   }
   //
   // With S3 it would be similar: ask your backend for a
   // "presigned URL", PUT the file directly to S3, and save
   // the resulting public URL in the same posts.image_url column.
   --------------------------------------------------------- */
function handleImageInputChange(event) {
  const file = event.target.files && event.target.files[0];
  const preview = document.getElementById("imagePreview");

  pendingImageFile = file || null;
  if (file && file.size > 5 * 1024 * 1024) {
    __talapo.toast("Images must be under 5 MB", "error");
    event.target.value = "";
    pendingImageFile = null;
    return;
  }
  if (!file) {
    pendingImageDataUrl = null;
    preview.hidden = true;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingImageDataUrl = String(reader.result); // mock: base64 en memoria
    preview.src = pendingImageDataUrl;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
}

/* ---------------------------------------------------------
   5) CREATE POST
   ---------------------------------------------------------
   // TODO API:
   //   const res = await fetch("/api/posts", {
   //     method: "POST",
   //     headers: { "Content-Type": "application/json" },
   //     body: JSON.stringify({ title, body, destinationId, imageUrl })
   //   });
   //   const newPost = await res.json();
   --------------------------------------------------------- */
async function createPost({ title, body, destinationId }) {
  if (!__talapo.requireLogin("Sign in to share your experience")) return false;
  if (!__talapo.online) return false;
  let imageUrl = null;
  if (pendingImageFile) {
    const ext = (pendingImageFile.name.split(".").pop() || "jpg").toLowerCase();
    const { data, error } = await __talapo.storage.from("forum-images")
      .upload(`${CURRENT_USER.id}/${Date.now()}.${ext}`, pendingImageFile);
    if (error) { reportError(error, "The image could not be uploaded"); return false; }
    imageUrl = data.url;
  }
  const { error } = await db.from("forum_posts").insert([{
    user_id: CURRENT_USER.id,
    author_name: CURRENT_USER.name,
    author_avatar: CURRENT_USER.avatarUrl === DEFAULT_AVATAR ? null : CURRENT_USER.avatarUrl,
    destination_id: Number(destinationId),
    title, body, image_url: imageUrl,
  }]);
  if (error) { reportError(error, "Your post could not be published"); return false; }
  pendingImageDataUrl = null;
  pendingImageFile = null;
  __talapo.toast("Post published");
  await loadPosts();
  return true;
}

/* ---------------------------------------------------------
   6) REACTIONS (like / love are mutually exclusive, save is separate)
   --------------------------------------------------------- */
async function toggleReaction(postId, type) {
  if (!__talapo.requireLogin("Sign in to react to posts")) return;
  const post = POSTS.find((p) => p.id === postId);
  if (!post) return;
  const previous = post.reactions[CURRENT_USER.id];

  const current = post.reactions[CURRENT_USER.id];
  if (current === type) {
    delete post.reactions[CURRENT_USER.id]; // clicking again = remove the reaction
  } else {
    post.reactions[CURRENT_USER.id] = type; // replaces like<->love
  }
  renderFeed(); // optimista: se ve al instante
  const req = previous === type
    ? db.from("forum_reactions").delete().eq("post_id", postId).eq("user_id", CURRENT_USER.id)
    : db.from("forum_reactions").upsert([{ post_id: postId, user_id: CURRENT_USER.id, type }], { onConflict: "post_id,user_id" });
  const { error } = await req;
  if (error) {
    if (previous) post.reactions[CURRENT_USER.id] = previous; else delete post.reactions[CURRENT_USER.id];
    renderFeed();
    reportError(error, "Your reaction was not saved");
  }
}

async function toggleSave(postId) {
  if (!__talapo.requireLogin("Sign in to save posts")) return;
  const post = POSTS.find((p) => p.id === postId);
  if (!post) return;

  const idx = post.saved.indexOf(CURRENT_USER.id);
  if (idx >= 0) {
    post.saved.splice(idx, 1);
  } else {
    post.saved.push(CURRENT_USER.id);
  }
  renderFeed();
  const nowSaved = post.saved.includes(CURRENT_USER.id);
  const { error } = nowSaved
    ? await db.from("forum_saves").insert([{ post_id: postId, user_id: CURRENT_USER.id }])
    : await db.from("forum_saves").delete().eq("post_id", postId).eq("user_id", CURRENT_USER.id);
  if (error) { reportError(error, "Could not update your saved posts"); await loadPosts(); }
}

function countReactions(post, type) {
  return Object.values(post.reactions).filter((r) => r === type).length;
}

/* ---------------------------------------------------------
   7) COMMENTS (one level of nesting: comment + replies)
   --------------------------------------------------------- */
async function addComment(postId, text, parentId = null) {
  const post = POSTS.find((p) => p.id === postId);
  if (!post || !text.trim()) return;
  if (!__talapo.requireLogin("Sign in to comment")) return;

  post.comments.push({
    id: `c-${Date.now()}`,
    userId: CURRENT_USER.id,
    authorName: CURRENT_USER.name,
    authorAvatar: CURRENT_USER.avatarUrl,
    body: text.trim(),
    createdAt: new Date().toISOString(),
    parentId
  });
  renderFeed();
  const { error } = await db.from("forum_comments").insert([{
    post_id: postId, parent_id: parentId, user_id: CURRENT_USER.id,
    author_name: CURRENT_USER.name,
    author_avatar: CURRENT_USER.avatarUrl === DEFAULT_AVATAR ? null : CURRENT_USER.avatarUrl,
    body: text.trim().slice(0, 1000),
  }]);
  if (error) reportError(error, "Your comment was not saved");
  await loadPosts();
}

/* ---------------------------------------------------------
   8) FORMAT HELPERS
   --------------------------------------------------------- */
function timeAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------------------------------------------------
   9) FEED RENDERING
   --------------------------------------------------------- */
function sortedPosts() {
  const posts = [...POSTS];
  if (currentSort === "popularidad") {
    return posts.sort((a, b) => popularityScore(b) - popularityScore(a));
  }
  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function popularityScore(post) {
  const likes = countReactions(post, "like");
  const loves = countReactions(post, "love");
  return likes + loves * 2 + post.comments.length + post.saved.length;
}

// A distinct color per department so the feed feels alive, keeping the
// Talapo palette (teal, accent, gold) plus a couple of extra accents
// (coral and violet) just for these chips.
const DEPARTMENT_COLORS = {
  "Sonsonate": "#1c6e6b",
  "La Libertad": "#0284c7",
  "Santa Ana": "#f59e0b",
  "Cuscatlán": "#8b5cf6",
  "La Paz": "#0ea5a3",
  "Morazán": "#e2725b",
  "San Salvador": "#0a2540"
};

/* ---------------------------------------------------------
   NUEVO: MODERACIÓN (reportar · ocultar · borrar)
   --------------------------------------------------------- */
const REASONS = [
  ["spam", "🚫 Spam or advertising"],
  ["offensive", "🤬 Offensive or hateful"],
  ["false", "❌ False information"],
  ["inappropriate", "🔞 Inappropriate content"],
  ["other", "💬 Other"],
];
function modButtons(kind, id, authorId, hidden) {
  if (!__talapo.online || !UUID_RE.test(String(id))) return "";
  const me = __talapo.user();
  const isAuthor = me && me.id === authorId;
  const admin = me && me.isAdmin;
  const b = [];
  if (!isAuthor) b.push(`<button class="mod-btn" data-action="mod-report" data-kind="${kind}" data-id="${id}"><i class="fas fa-flag"></i> Report</button>`);
  if (admin) b.push(`<button class="mod-btn" data-action="mod-hide" data-kind="${kind}" data-id="${id}" data-hidden="${hidden}"><i class="fas ${hidden ? "fa-eye" : "fa-eye-slash"}"></i> ${hidden ? "Show" : "Hide"}</button>`);
  if (admin || isAuthor) b.push(`<button class="mod-btn danger" data-action="mod-delete" data-kind="${kind}" data-id="${id}"><i class="fas fa-trash"></i> Delete</button>`);
  return b.length ? `<div class="mod-row">${b.join("")}</div>` : "";
}

function openReportDialog(kind, id) {
  if (!__talapo.requireLogin("Sign in to report content")) return;
  document.getElementById("modDialog")?.remove();
  const wrap = document.createElement("div");
  wrap.id = "modDialog";
  wrap.className = "mod-dialog";
  wrap.innerHTML = `
    <form class="mod-card">
      <h3>⚑ Report ${kind === "post" ? "post" : "comment"}</h3>
      <p>Why should the Talapo team review it?</p>
      ${REASONS.map(([v, l], i) => `<label class="mod-opt"><input type="radio" name="reason" value="${v}" ${i === 0 ? "checked" : ""}> ${l}</label>`).join("")}
      <textarea name="details" maxlength="300" placeholder="More details (optional)"></textarea>
      <div class="mod-actions"><button type="button" class="mod-cancel">Cancel</button><button type="submit" class="mod-send">Send report</button></div>
    </form>`;
  document.getElementById("feedList").closest(".legacy-host, body").appendChild(wrap);
  wrap.querySelector(".mod-cancel").onclick = () => wrap.remove();
  wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
  wrap.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const row = { reporter_id: __talapo.user().id, reason: fd.get("reason"), details: String(fd.get("details") || "").trim() || null };
    row[kind === "post" ? "post_id" : "comment_id"] = id;
    const { error } = await db.from("forum_reports").insert([row]);
    wrap.remove();
    if (error && /duplicate|unique/i.test(error.message)) return __talapo.toast("You already reported this. Thank you!", "info");
    if (error) return reportError(error, "The report could not be sent");
    __talapo.toast("Thank you! The Talapo team will review it 🙏");
  };
}

async function modHide(kind, id, hiddenNow) {
  const table = kind === "post" ? "forum_posts" : "forum_comments";
  const { error } = await db.from(table).update({ hidden: !hiddenNow }).eq("id", id);
  if (error) return reportError(error, "Could not change visibility");
  if (hiddenNow) await db.from("forum_reports").update({ resolved: true }).eq(kind === "post" ? "post_id" : "comment_id", id);
  __talapo.toast(hiddenNow ? "Visible again" : "Hidden from the forum");
  await loadPosts();
}

async function modDelete(kind, id) {
  if (!confirm(`Delete this ${kind}? This cannot be undone.`)) return;
  const table = kind === "post" ? "forum_posts" : "forum_comments";
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return reportError(error, "Could not delete");
  __talapo.toast("Deleted");
  await loadPosts();
}

// NUEVO: enlace al perfil público del autor (solo usuarios reales de InsForge)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function profileLink(userId, inner, extraClass = "") {
  if (!userId || !UUID_RE.test(String(userId))) return inner;
  return `<a class="author-link ${extraClass}" href="/travelers/${userId}" title="View profile">${inner}</a>`;
}

function renderCommentNode(post, comment) {
  const isReply = Boolean(comment.parentId);
  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      ${profileLink(comment.userId, `<img class="comment-avatar" src="${comment.authorAvatar}" alt="${escapeHtml(comment.authorName)}">`)}
      <div style="flex:1;">
        <div class="comment-bubble">
          <p class="comment-author">${profileLink(comment.userId, escapeHtml(comment.authorName))}</p>
          <p class="comment-text">${escapeHtml(comment.body)}</p>
          ${comment.hidden ? '<span class="mod-hidden">🙈 Hidden · under review</span>' : ''}
        </div>
        ${modButtons('comment', comment.id, comment.userId, comment.hidden)}
        ${
          !isReply
            ? `<div class="comment-actions"><button data-action="show-reply" data-comment-id="${comment.id}">Reply</button></div>
               <div class="reply-form" id="reply-form-${comment.id}" hidden>
                 <input type="text" placeholder="Write a reply..." data-reply-input="${comment.id}">
                 <button data-action="send-reply" data-post-id="${post.id}" data-comment-id="${comment.id}"><i class="fas fa-paper-plane"></i></button>
               </div>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderComments(post) {
  const topLevel = post.comments.filter((c) => !c.parentId);

  return topLevel
    .map((comment) => {
      const replies = post.comments.filter((c) => c.parentId === comment.id);
      const repliesHtml = replies.length
        ? `<div class="comment-replies">${replies.map((r) => renderCommentNode(post, r)).join("")}</div>`
        : "";
      return renderCommentNode(post, comment) + repliesHtml;
    })
    .join("");
}

function renderPostCard(post, isTopPopular) {
  const destination = getDestination(post.destinationId);
  const userReaction = post.reactions[CURRENT_USER.id];
  const isSaved = post.saved.includes(CURRENT_USER.id);
  const deptColor = (destination && DEPARTMENT_COLORS[destination.department]) || "var(--talapo-teal)";

  return `
    <article class="post-card" data-post-id="${post.id}" style="--dept-color: ${deptColor}">
      <div class="post-image-wrap">
        ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}" alt="${escapeHtml(post.title)}">` : ""}
        <div class="post-image-overlay">
          ${isTopPopular ? '<span class="popular-ribbon"><i class="fas fa-fire"></i> Popular</span>' : ""}
          ${destination ? `<span class="destination-badge" style="--dept-color: ${deptColor}"><i class="fas fa-map-marker-alt"></i> ${destination.name} · ${destination.department}</span>` : ""}
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
        </div>
        <div class="post-author-pill">
          ${profileLink(post.userId, `<img class="post-avatar" src="${post.authorAvatar}" alt="${escapeHtml(post.authorName)}">`)}
          <div>
            <p class="post-author-name">${profileLink(post.userId, escapeHtml(post.authorName))}</p>
            <p class="post-date">${timeAgo(post.createdAt)}</p>
          </div>
        </div>
      </div>

      <div class="post-body">
        <p class="post-text">${escapeHtml(post.body)}</p>

        <div class="reactions-bar">
          <button class="reaction-btn ${userReaction === "like" ? "is-active" : ""}" data-action="react" data-type="like" data-post-id="${post.id}">
            <i class="fas fa-thumbs-up"></i> <span class="reaction-count">${countReactions(post, "like")}</span>
          </button>
          <button class="reaction-btn ${userReaction === "love" ? "is-active" : ""}" data-action="react" data-type="love" data-post-id="${post.id}">
            <i class="fas fa-heart"></i> <span class="reaction-count">${countReactions(post, "love")}</span>
          </button>
          <button class="reaction-btn ${isSaved ? "is-active" : ""}" data-action="save" data-post-id="${post.id}">
            <i class="fas fa-bookmark"></i>
          </button>
          <button class="comments-toggle-btn" data-action="toggle-comments" data-post-id="${post.id}">
            <i class="fas fa-comment"></i> ${post.comments.length} comments
          </button>
        </div>
        ${post.hidden ? '<p class="mod-hidden big">🙈 This post is hidden while the Talapo team reviews it.</p>' : ''}
        ${modButtons('post', post.id, post.userId, post.hidden)}
      </div>

      <div class="comments-section" id="comments-${post.id}">
        <div class="comment-list">${renderComments(post) || '<p style="color:#94a3b8;font-size:0.85rem;">Be the first to comment.</p>'}</div>
        <form class="add-comment-form" data-action="add-comment" data-post-id="${post.id}">
          <img class="comment-avatar" src="${CURRENT_USER.avatarUrl}" alt="${escapeHtml(CURRENT_USER.name)}">
          <input type="text" placeholder="Write a comment..." data-comment-input="${post.id}">
          <button type="submit"><i class="fas fa-paper-plane"></i></button>
        </form>
      </div>
    </article>
  `;
}

function renderFeed() {
  const feedList = document.getElementById("feedList");
  const openIds = new Set(
    Array.from(document.querySelectorAll(".comments-section.is-open")).map((el) =>
      el.id.replace("comments-", "")
    )
  );

  if (!POSTS.length && __talapo.online) {
    feedList.innerHTML = '<p class="forum-empty">No posts yet — be the first to share your trip! ✈️</p>';
    return;
  }
  feedList.innerHTML = sortedPosts()
    .map((post, index) => renderPostCard(post, currentSort === "popularidad" && index === 0))
    .join("");

  openIds.forEach((id) => {
    const section = document.getElementById(`comments-${id}`);
    if (section) section.classList.add("is-open");
  });
}

/* ---------------------------------------------------------
   10) EVENTS (delegated on the feed and the form)
   --------------------------------------------------------- */
function initDestinationSelect() {
  const select = document.getElementById("postDestination");
  select.innerHTML = DESTINATIONS.map(
    (d) => `<option value="${d.id}">${d.name} — ${d.department}</option>`
  ).join("");
}

function initCreatePostForm() {
  document.getElementById("postImage").addEventListener("change", handleImageInputChange);

  document.getElementById("createPostForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("postTitle").value.trim();
    const body = document.getElementById("postBody").value.trim();
    const destinationId = document.getElementById("postDestination").value;
    if (!title || !body) return;

    const submitBtn = event.target.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    createPost({ title, body, destinationId }).then((ok) => {
      if (submitBtn) submitBtn.disabled = false;
      if (!ok) return;
      event.target.reset();
      document.getElementById("imagePreview").hidden = true;
    });
  });
}

function initSortToggle() {
  document.getElementById("sortToggle").addEventListener("click", (event) => {
    const btn = event.target.closest(".sort-btn");
    if (!btn) return;
    currentSort = btn.dataset.sort;
    document.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderFeed();
  });
}

function initFeedDelegation() {
  const feedList = document.getElementById("feedList");

  feedList.addEventListener("click", (event) => {
    const modBtn = event.target.closest('[data-action^="mod-"]');
    if (modBtn) {
      const { kind, id, action } = { kind: modBtn.dataset.kind, id: modBtn.dataset.id, action: modBtn.dataset.action };
      if (action === "mod-report") openReportDialog(kind, id);
      if (action === "mod-hide") modHide(kind, id, modBtn.dataset.hidden === "true");
      if (action === "mod-delete") modDelete(kind, id);
      return;
    }
    const reactBtn = event.target.closest('[data-action="react"]');
    if (reactBtn) {
      toggleReaction(reactBtn.dataset.postId, reactBtn.dataset.type);
      return;
    }

    const saveBtn = event.target.closest('[data-action="save"]');
    if (saveBtn) {
      toggleSave(saveBtn.dataset.postId);
      return;
    }

    const toggleBtn = event.target.closest('[data-action="toggle-comments"]');
    if (toggleBtn) {
      document.getElementById(`comments-${toggleBtn.dataset.postId}`).classList.toggle("is-open");
      return;
    }

    const showReplyBtn = event.target.closest('[data-action="show-reply"]');
    if (showReplyBtn) {
      const form = document.getElementById(`reply-form-${showReplyBtn.dataset.commentId}`);
      form.hidden = !form.hidden;
      return;
    }

    const sendReplyBtn = event.target.closest('[data-action="send-reply"]');
    if (sendReplyBtn) {
      const input = feedList.querySelector(`[data-reply-input="${sendReplyBtn.dataset.commentId}"]`);
      addComment(sendReplyBtn.dataset.postId, input.value, sendReplyBtn.dataset.commentId);
      return;
    }
  });

  feedList.addEventListener("submit", (event) => {
    const form = event.target.closest('[data-action="add-comment"]');
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector(`[data-comment-input="${form.dataset.postId}"]`);
    addComment(form.dataset.postId, input.value);
  });
}

/* ---------------------------------------------------------
   STARTUP
   --------------------------------------------------------- */
__ready( () => {
  initDestinationSelect();
  initCreatePostForm();
  initSortToggle();
  initFeedDelegation();
  renderFeed();
  loadPosts();

  // Mobile menu (same pattern as the rest of the site)
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
  }
});


__ready( () => {
    updateRotativeCarousel();
    startAutoPlay();

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        navLinks?.classList.toggle('active');
        
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    __listen(document, 'click', (e) => {
        if (navLinks?.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
            navLinks.classList.remove('active');
            const icon = menuToggle?.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    });
});


// Sincronizar la foto del pasaporte con la barra de navegación del Main
    __ready( () => {
        const savedPassport = localStorage.getItem('talapo_passport');
        if (savedPassport) {
            const data = JSON.parse(savedPassport);
            const navProfileImg = document.querySelector('.nav-profile-img');
            if (navProfileImg && data.fotoUrl) {
                navProfileImg.src = data.fotoUrl;
            }
        }
}); 
;

if (typeof __onload === "function") __ready(__onload);
