/* eslint-disable */
// Código original de components/typicalrecipes.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
// 1. Recipes details
const baseRecetas = [
    // --- CATEGORY: FAVORITES ---
    { 
        id: 1, nombre: "Panes con Pollo Salvadoreños", dificultad: "medium", tiempo: "1 h 15 min", categoria: "Antojitos",
        video: "/assets/mp4/Panesdepollo.mp4",
        desc: "A legendary Salvadoran street food and holiday classic. Warm, artisan water bread rolls stuffed with juicy, shredded stewed chicken, heavily drenched in a rich, spiced tomato recado sauce, and packed with fresh watercress, radish, and cucumber.", 
        ingredientes: ["1 whole chicken or chicken pieces", "6 pan francés (sub rolls)", "4 tomatoes", "1/2 cup relajo salvadoreño (seed mix)", "Watercress, cucumber, radishes"],
        pasos: [
            "Clean the chicken thoroughly, season it with mustard, garlic paste, and Worcestershire sauce, and brown it in a large pot with a splash of oil until golden.",
            "Toast the relajo salvadoreño (a mix of pumpkin seeds, sesame seeds, peanuts, bay leaves, and chilies) in a dry skillet until highly aromatic, making sure it doesn't burn.",
            "Blend the roasted relajo with boiled tomatoes, onions, green bell peppers, and garlic, then pour this rich, thick sauce over the chicken and simmer for 35 minutes until tender.",
            "While the chicken cooks, wash and slice fresh cucumbers, radishes, tomatoes, and clean the fresh watercress or iceberg lettuce.",
            "Take a piece of pan francés and slice it lengthwise down the middle, creating a pocket but leaving the back crust connected.",
            "Spread a small amount of mayonnaise or mustard inside the bread, layer a bed of watercress, lettuce, cucumber, and radish slices.",
            "Stuff the bread generously with the warm shredded chicken and ladle a massive scoop of the hot, savory tomato recado sauce over everything so the bread absorbs all the flavor."
        ]
    },
    { 
        id: 2, nombre: "Pupusas Revueltas", dificultad: "easy", tiempo: "25 min", categoria: "Pupusas",
        video: "videos/pupusas_revueltas.mp4",
        desc: "The crowd favorite pupusa combination. Stuffed with seasoned, savory ground pork chicharrón, creamy traditional refried red beans, and gooey melted quesillo cheese.", 
        ingredientes: ["2 cups corn masa flour", "1/2 cup refried red beans", "1/2 cup ground pork chicharrón", "1/2 cup quesillo"],
        pasos: [
            "Knead the corn masa flour with water in a spacious bowl until it forms a soft, flexible dough that does not stick to your fingers.",
            "In a separate small bowl, thoroughly mix the savory ground pork chicharrón, the warm refried red beans, and the shredded quesillo together until they form a single uniform paste.",
            "Take a handful of dough, shape it into a smooth ball, and hollow out the center with your thumbs to form a cup-like space.",
            "Spoon a generous amount of the combined pork, bean, and cheese mixture right into the center of the dough cup.",
            "Wrap the outer edges of the dough up and over the filling, sealing it tightly so that none of the filling escapes during flattening.",
            "Lightly grease your hands with oil and pat the ball out by clapping it between your palms until it transforms into a flat, round pocket.",
            "Grill the pupusa on a very hot, lightly oiled griddle for about 3 to 4 minutes on each side. Look for beautiful golden-brown char patches to ensure it is thoroughly cooked."
        ]
    },
    { 
        id: 3, nombre: "Pupusas de Ayote", dificultad: "easy", tiempo: "25 min", categoria: "Pupusas",
        video: "videos/pupusas_ayote.mp4",
        desc: "A delicious, light vegetarian variation of the traditional dish. Filled with finely grated native green squash cooked with onions and melted cheese.", 
        ingredientes: ["2 cups corn masa flour", "1 cup finely grated ayote squash", "1 cup cheese", "1/2 minced onion"],
        pasos: [
            "Grate the fresh green ayote squash very finely, place it in a clean cloth, and squeeze firmly to drain out all excess moisture.",
            "Sauté the minced onions in a pan with a splash of oil, add the grated squash, season with a pinch of salt, and cook for 5 minutes until soft.",
            "Allow the squash to cool down completely, then thoroughly blend it into a bowl with your shredded quesillo cheese.",
            "Prepare the corn masa by kneading flour and water together until it feels perfectly smooth and workable.",
            "Pinch off a piece of dough, roll it into a round sphere, and push your thumbs down into the middle to shape it into a small bowl.",
            "Fill the pocket with the cooled squash and cheese mixture, then carefully fold the edges inward to seal the top.",
            "Moisten your hands with oil, clap the ball flat into a neat circular shape, and cook it on a medium-hot comal for 4 minutes per side until the cheese melts beautifully."
        ]
    },
    { 
        id: 4, nombre: "Tamales de Pollo", dificultad: "difficult", tiempo: "2 h", categoria: "Tamales",
        video: "videos/tamales_pollo.mp4",
        desc: "Rich, savory corn masa tamales seasoned thoroughly with intense poultry broth. Filled with shredded chicken, soft potatoes, and chickpeas, wrapped elegantly in plantain leaves.", 
        ingredientes: ["2 lbs corn masa", "1 cup chicken fat or lard", "4 cups intense chicken stock", "Shredded chicken", "Green banana leaves"],
        pasos: [
            "Prepare the banana leaves by wiping them clean, removing the stiff center ribs, and briefly blanching them over an open flame or boiling water until they become soft, shiny, and pliable.",
            "In a large heavy-bottomed pot, mix your corn masa with intense, well-seasoned chicken stock, chicken fat, and salt, stirring vigorously to remove all lumps.",
            "Place the pot over medium heat and stir constantly for 30 to 40 minutes without stopping until the mixture cooks down into a silky, thick paste that pulls away from the sides of the pot.",
            "Layout a clean piece of prepared banana leaf on a flat workspace. Spoon about half a cup of the warm cooked masa right onto the center of the leaf.",
            "Place a generous piece of seasoned shredded chicken, a slice of cooked potato, a strip of bell pepper, and a few chickpeas on top of the masa bed.",
            "Carefully fold the long edges of the banana leaf over the filling to create a snug rectangle, then fold the outer ends securely underneath to seal it completely.",
            "Line the bottom of a large deep pot with extra banana leaves, stack the tamales vertically inside, add two cups of water to the bottom, cover tightly, and steam over medium heat for 1 full hour."
        ]
    },
    { 
        id: 5, nombre: "Tamales de Pisque", dificultad: "medium", tiempo: "1 h 30 min", categoria: "Tamales",
        video: "videos/tamales_pisque.mp4",
        desc: "Traditional seasoned corn masa mixed with a hint of wood ash water for flavor, stuffed with rich savory refried red beans and packaged in banana leaves.", 
        ingredientes: ["3 cups corn masa seasoned with cal/ash", "1.5 cups seasoned refried red beans", "Banana leaves"],
        pasos: [
            "Prepare and soften your fresh green banana leaves by running them over a warm burner until they are flexible enough to fold without breaking.",
            "Mix your seasoned corn masa with water and a touch of oil or lard, vending it well until it achieves a smooth texture, then cook it over low heat while stirring continuously until it turns into a thick dough.",
            "Let the masa cool slightly so it is easy to handle. Lay out a square piece of your banana leaf on a table.",
            "Place a large scoop of the dough in the center of the leaf and flatten it slightly with the back of a spoon.",
            "Add a generous line of rich, well-seasoned refried red beans directly into the middle of the dough bed.",
            "Roll the banana leaf up tightly around the dough, folding both of the open ends backward underneath the package to form a tight, neat parcel.",
            "Arrange the parcels carefully in a steaming pot, cover them with an extra layer of leaves and a tight lid, and steam them over medium heat for 50 to 60 minutes."
        ]
    },
    { 
        id: 6, nombre: "Yuca Frita con Chicharrón", dificultad: "easy", tiempo: "30 min", categoria: "Antojitos",
        video: "videos/yuca_frita.mp4",
        desc: "Crispy fried cassava chunks served over a fresh bed of tart curtido cabbage salad, topped with deep-fried pork chicharrón.", 
        ingredientes: ["1 lb fresh cassava root", "1/2 lb pork belly chunks", "Oil for frying", "Curtido salad"],
        pasos: [
            "Peel the fresh cassava root thoroughly, slice it into manageable 4-inch cylindrical blocks, and rinse them well under cold running water.",
            "Place the cassava blocks into a pot of boiling salted water along with a couple of garlic cloves, and cook for 20 minutes until they are tender enough to pierce with a fork but still firm.",
            "Drain the cassava, let it cool, and carefully slice each block lengthwise into thick wedges, making sure to pull out and discard the woody fiber core running through the center.",
            "Heat a generous amount of vegetable oil in a deep frying pan over high heat until it reaches a shimmering temperature.",
            "Drop the cassava wedges into the hot oil and deep-fry them for about 5 to 7 minutes until they form an incredibly crunchy, golden-brown crust on the outside while remaining fluffy inside.",
            "In another pan, slow-cook the seasoned pork belly chunks in their own fat until they turn into deeply browned, crispy, savory chicharrones.",
            "Assemble the dish by laying down a generous pile of crispy yuca, covering it with a mountain of tangy curtido cabbage salad, pouring warm tomato sauce over it, and scattering the hot chicharrones on top."
        ]
    },
    { 
        id: 7, nombre: "Empanadas", dificultad: "easy", tiempo: "25 min", categoria: "Antojitos",
        video: "videos/empanadas.mp4",
        desc: "Sweet ripe plantain dough shaped into smooth small torpedoes, stuffed with a thick vanilla milk custard, fried golden and rolled in sugar.", 
        ingredientes: ["3 ripe plantains", "1 cup milk", "2 tbsp cornstarch", "White sugar", "Cinnamon stick"],
        pasos: [
            "Cut the tips off very ripe plantains (the skins should be mostly black), slice them into three pieces each, and boil them with their skins on in a pot of water for 15 minutes until they are tender.",
            "Remove the plantains from the water, peel off the skins, place the hot fruit into a bowl, and mash them thoroughly with a fork or potato masher into a completely smooth, lump-free paste. Let it cool down.",
            "To make the 'poleada' filling, whisk the milk, cornstarch, sugar, and a cinnamon stick together in a small saucepan over medium-low heat.",
            "Stir the milk mixture continuously with a wooden spoon for 8 to 10 minutes until it weakens into a very heavy, smooth custard. Remove the cinnamon stick and let it cool completely until it sets.",
            "Take a small handful of the cooled plantain paste, roll it into a ball, and flatten it in your hand to form a round disc.",
            "Place a small spoonful of the thick vanilla custard right in the middle of the plantain disc.",
            "Carefully fold the plantain dough over the custard, pinching the edges closed and smoothing it out into an oval, football-like shape.",
            "Fry the empanadas in a pan with hot oil for 2 to 3 minutes per side until they turn a dark golden color, then lift them out and roll them immediately in a bowl of white sugar until fully coated."
        ]
    },
    { 
        id: 8, nombre: "Pastelitos de Picado", dificultad: "medium", tiempo: "35 min", categoria: "Antojitos",
        video: "videos/pastelitos.mp4",
        desc: "Crispy fried crescent corn turnovers infused with natural orange achiote, stuffed with spiced ground beef and minced potatoes.", 
        ingredientes: ["2 cups corn masa", "1 tsp achiote paste", "1/2 cup cooked ground beef with potatoes", "Oil"],
        pasos: [
            "To prepare the filling, sauté finely minced onions and garlic in a pan, add the ground beef and tiny, finely diced potatoes, season with cumin and salt, and cook until the beef is browned and the potatoes are tender.",
            "Dissolve the achiote paste in your water, then pour it over the corn masa flour, kneading everything together until the dough turns a bright, vibrant orange color and feels highly pliable.",
            "Pinch off a small piece of the orange dough and flatten it out between two pieces of plastic wrap using a flat plate or a tortilla press to form a neat, thin circle.",
            "Place a spoonful of the cooled beef and potato filling onto one half of the dough circle.",
            "Lift the plastic wrap to fold the other half of the dough over the filling, creating a classic crescent or half-moon shape.",
            "Press the curved outer edges down firmly with your fingers or a fork to seal the turnover tightly so no meat leaks out into the oil.",
            "Deep-fry the pastelitos in a pot of very hot oil for 4 to 5 minutes until the exterior feels exceptionally crunchy and rigid. Serve hot with fresh curtido salad."
        ]
    },
    { 
        id: 9, nombre: "Riguas de Maíz Tierno", dificultad: "medium", tiempo: "30 min", categoria: "Antojitos",
        video: "videos/riguas.mp4",
        desc: "Sweet, rustic corn cakes made from freshly ground young sweet corn masa, patted flat onto fresh banana leaves and grilled until smokey and aromatic. Served hot with local sour cream.", 
        ingredientes: ["4 cups fresh elote (young sweet corn kernels)", "2 tbsp melted butter", "1/2 tsp salt", "1 tbsp sugar", "Fresh banana leaves"],
        pasos: [
            "Cut the fresh sweet corn kernels off the cobs and blend or grind them without adding any water until you get a thick, coarse, and slightly wet masa.",
            "Mix the corn masa in a bowl with melted butter, sugar, and a pinch of salt until everything is completely integrated.",
            "Prepare your banana leaves by cutting them into clean rectangles roughly the size of a sheet of paper.",
            "Place a generous spoonful of the sweet corn mixture directly onto one half of a banana leaf rectangle.",
            "Fold the other half of the banana leaf over the dough to cover it neatly, patting it down gently to flatten the corn mixture into a rustic pancake shape inside the leaf.",
            "Place the wrapped leaf onto a hot comal or griddle over medium heat and cook for about 6 to 8 minutes.",
            "Flip the package over and cook for another 6 minutes until the banana leaf is heavily charred and the inner corn cake feels firm, sweet, and perfectly cooked through. Serve warm with fresh crema salvadoreña."
        ]
    },
    { 
        id: 10, nombre: "Chilaquilas Salvadoranos", dificultad: "medium", tiempo: "30 min", categoria: "Antojitos",
        video: "videos/chilaquilas.mp4",
        desc: "Comforting layers of corn tortillas filled with rich local cheese, battered heavily in whipped eggs, fried, and stewed in mild tomato sauce.", 
        ingredientes: ["6 corn tortillas", "1 cup quesillo cheese", "3 large eggs", "2 cups tomato sauce"],
        pasos: [
            "Take two standard corn tortillas and create a sandwich by placing a thick, generous slab of local quesillo or mozzarella cheese directly between them.",
            "Separate the egg whites from the yolks into a clean, dry bowl. Beat the egg whites with an electric mixer until they form stiff, fluffy peaks.",
            "Gently fold the egg yolks back into the whipped whites one by one, adding a tiny pinch of salt, until you have a smooth, airy batter.",
            "Carefully pick up a tortilla-cheese sandwich, submerge it completely into the egg batter, and ensure it is heavily coated on all sides.",
            "Immediately slide the battered sandwich into a frying pan filled with hot oil and cook for 2 minutes per side until the egg batter turns fluffy and beautifully golden.",
            "While frying, simmer a rich, mild tomato sauce made with blended tomatoes, onions, garlic, and wild oregano in a separate wide pot.",
            "Transfer the fried, crispy chilaquiles directly into the simmering tomato sauce, cover the pot, and let them stew on low heat for 10 minutes until the tortillas soften and the inner cheese becomes incredibly gooey."
        ]
    },
    { 
        id: 11, nombre: "Sopa de Pata", dificultad: "difficult", tiempo: "2 h 30 min", categoria: "Soups",
        video: "videos/sopa_de_pata.mp4",
        desc: "A hearty, thick traditional Sunday soup made from cow feet and tripe, cooked with fresh cassava, sweet corn, and chayote squash.", 
        ingredientes: ["2 lbs clean cow feet", "1 lb tripe", "1 cassava root", "2 chayotes", "Achiote, garlic"],
        pasos: [
            "Clean the cow feet and tripe meticulously using plenty of fresh lime juice, salt, and cold water to remove all impurities.",
            "Place the cleaned cow feet into a large pressure cooker filled with water, garlic, onions, and bay leaves. Cook on high pressure for 1 hour until the meat is incredibly tender and falling off the bone.",
            "Cut the tender tripe into small bite-sized squares and add it into the main broth along with a spoonful of achiote paste for color.",
            "Chop rustic chunks of fresh cassava (yuca), sweet corn on the cob (elote), chayote squash, and green plantains.",
            "Drop the harder vegetables like cassava and corn into the boiling broth first, letting them simmer for 15 minutes before adding the softer squashes.",
            "Blend a mixture of toasted pumpkin seeds (relajo), tomatoes, and garlic, then strain this aromatic paste directly into the soup pot to thicken the broth.",
            "Simmer everything together on low heat for an additional 20 minutes until the broth turns rich, thick, and highly flavorful. Serve hot with fresh cilantro and lime."
        ]
    },
    { 
        id: 12, nombre: "Sopa de Gallina India", dificultad: "difficult", tiempo: "2 h 30 min", categoria: "Soups",
        video: "videos/sopa_de_gallina.mp4",
        desc: "Nutritious countryside broth cooked with free-range yard hens, loaded with fresh garden vegetables and aromatic mint.", 
        ingredientes: ["1 whole free-range yard hen", "Yuca root", "Chayote", "Fresh mint leaves", "Pipián squash"],
        pasos: [
            "Cut the whole free-range yard hen into traditional portions, rub them with lime juice, and rinse thoroughly.",
            "Place the hen pieces into a massive soup pot filled with cold water, whole heads of garlic, sweet onions, and bell peppers. Bring to a boil and simmer gently for 1.5 to 2 hours until the meat is tender.",
            "Skim off any excess foam that rises to the top of the broth periodically to keep the soup clean and clear.",
            "Chop fresh cassava root, chayote, carrots, and native pipián squashes into large, hearty chunks.",
            "Add the vegetables along with a massive handful of fresh wild mint leaves directly into the boiling soup during the last 20 minutes of cooking.",
            "Carefully remove the cooked hen pieces from the broth, brush them generously with a mixture of mustard, Worcestershire sauce, and local spices.",
            "Grill the seasoned hen pieces over hot charcoal or roast them in an oven until the skin is crispy and caramelized, then serve them on a plate right alongside the piping hot bowl of vegetable soup."
        ]
    },
    { 
        id: 13, nombre: "Mariscada Salvadoreña", dificultad: "difficult", tiempo: "1 h 15 min", categoria: "Soups",
        video: "videos/mariscada.mp4",
        desc: "An ultra-luxurious, rich seafood soup combining blue crabs, jumbo shrimp, fish, and calamari in a creamy cilantro broth.", 
        ingredientes: ["2 whole blue crabs", "1/2 lb jumbo shrimp", "1/2 lb white fish fillets", "1 cup heavy cream", "Cilantro"],
        pasos: [
            "Wash all the seafood thoroughly. Scrub the blue crabs clean and slice the white fish fillets into uniform, firm cubes.",
            "Sauté minced garlic, sweet chopped onions, and blended red tomatoes in a very large pot with butter until a rich, liquid sofrito forms.",
            "Add the clean crabs and the shrimp shells/heads into the sofrito bed first, frying them for 5 minutes to release all of their rich umami seafood essence into the oil.",
            "Pour 5 cups of water or fish stock into the pot, bring to a rapid boil, and let it reduce over medium heat for 20 minutes.",
            "Carefully strain out any loose shells if desired, then slide the tender white fish cubes, clean shrimp bodies, and calamari rings into the boiling broth.",
            "Lower the heat immediately and slowly pour in the heavy cream while stirring gently to prevent it from curdling.",
            "Toss in a large handful of freshly chopped cilantro, simmer softly for 5 more minutes until the fish flakes easily, and serve warm with toasted tortillas."
        ]
    },
    { 
        id: 14, nombre: "Sopa de Frijoles con Masa", dificultad: "medium", tiempo: "55 min", categoria: "Soups",
        video: "videos/sopa_frijoles.mp4",
        desc: "Hearty red bean soup filled with pork ribs and small tender handmade corn dumplings pinched in the center.", 
        ingredientes: ["2 cups fresh red beans", "1 lb pork ribs", "1 cup corn masa", "Garlic, onion"],
        pasos: [
            "Sort through fresh red beans to remove stones, rinse them well, and place them in a deep soup pot with 8 cups of water.",
            "Add pork ribs cut into individual pieces, a whole head of garlic sliced in half, and an onion into the pot with the beans.",
            "Boil vigorously for 45 minutes to 1 hour until both the beans and the pork meat feel incredibly tender.",
            "While the soup boils, prepare a small bowl of corn masa mixed with a bit of lard, salt, and a splash of water until it handles like smooth clay.",
            "Form very small balls of dough (the size of marbles) and use your thumb to push an indentation right into the center of each one, shaping them into traditional 'chochoyotes'.",
            "Drop the corn dumplings one by one directly into the boiling hot bean broth.",
            "Allow the soup to simmer uncovered for an additional 15 minutes. The corn dumplings will cook through, rise to the top, and naturally thicken the entire bean broth into a velvety soup."
        ]
    },
    { 
        id: 15, nombre: "Quesadilla Salvadoreña", dificultad: "easy", tiempo: "35 min", categoria: "Sweets",
        video: "videos/quesadilla.mp4",
        desc: "A heavy, rich, savory-sweet cake crafted with authentic hard cheese, sour cream, and sprinkled with sesame seeds.", 
        ingredientes: ["2 cups rice flour", "1 cup Salvadoran hard cheese", "1 cup sour cream", "1 cup sugar", "3 eggs", "Sesame seeds"],
        pasos: [
            "In a large bowl, use a hand mixer to beat the eggs and white sugar together on high speed for 5 minutes until thick and pale yellow.",
            "Lower the mixer speed and blend in the heavy Salvadoran sour cream (crema) along with the finely grated local hard cheese (queso duro viejo).",
            "Sift the rice flour gradually into the wet mixture, folding it in gently with a spatula until a smooth, pourable batter forms without any dry pockets.",
            "Let the batter rest on the counter for 15 minutes to allow the rice flour to fully absorb the liquids and expand.",
            "Grease a rectangular baking pan generously with butter and pour the rich cheese batter inside, leveling it evenly.",
            "Generously sprinkle raw sesame seeds across the entire top surface of the batter to form a decorative, crunchy crust.",
            "Bake in a preheated oven at 350°F (175°C) for 30 to 35 minutes until a toothpick inserted in the center comes out completely clean and the top turns a beautiful dark golden color."
        ]
    },
    { 
        id: 16, nombre: "Nuegados", dificultad: "medium", tiempo: "45 min", categoria: "Sweets",
        video: "videos/nuegados.mp4",
        desc: "Fluffy yuca and cheese fritters drenched in a rich, dark panela sugarcane syrup.", 
        ingredientes: ["2 cups grated raw cassava", "1 cup grated hard cheese", "1 egg", "1 block panela sugar", "Cinnamon"],
        pasos: [
            "Peel fresh cassava roots, remove the inner woody core, and grate them using the finest side of your grater until you have a smooth, wet pulp.",
            "Place the grated cassava pulp into a bowl and mix it thoroughly with the finely grated hard cheese, one whole egg, and a tiny pinch of baking powder.",
            "Knead the mixture with your hands until it forms a uniform, slightly sticky dough paste.",
            "Form the dough into small, flattened balls or discs about 2 inches wide.",
            "Fry the yuca discs in a pan filled with deep, hot vegetable oil over medium heat for 4 minutes per side until they turn incredibly crispy and golden-brown.",
            "To make the syrup, melt a whole block of panela sugarcane (dulce de panela) in a small pot with 1 cup of water and a thick cinnamon stick over low heat.",
            "Let the syrup simmer and bubble for 15 minutes until it thickens into a dark, heavy amber glaze, then pour it generously over the hot, fresh nuegados before serving."
        ]
    },
    { 
        id: 17, nombre: "Canoas", dificultad: "medium", tiempo: "35 min", categoria: "Sweets",
        video: "videos/canoas.mp4",
        desc: "Whole fried sweet plantains split open like boats, stuffed with velvety vanilla custard, raisins, and cinnamon.", 
        ingredientes: ["3 whole ripe plantains", "1.5 cups milk custard", "2 tbsp raisins", "Ground cinnamon"],
        pasos: [
            "Select very ripe plantains with yellow skins covered in black spots, peel them completely, and leave them whole.",
            "Heat a shallow layer of oil in a wide frying pan over medium heat, add the whole plantains, and fry them gently for 6 to 8 minutes, turning frequently until they are golden-brown and soft all the way through.",
            "Remove the plantains from the oil and drain them on paper towels.",
            "While still warm, use a butter knife to cut a long slit lengthwise down the center of each plantain, making sure not to cut all the way through the bottom.",
            "Gently pry the slit open with two spoons to create a hollow 'boat' or pouch shape in the center of the fruit.",
            "Spoon a generous amount of warm, thick home-cooked vanilla milk custard (poleada) directly into the plantain opening.",
            "Garnish the custard filling with a scattering of dark raisins and a heavy dusting of ground cinnamon. Serve warm as a traditional afternoon snack."
        ]
    },
    { 
        id: 18, nombre: "Atol de Elote", dificultad: "medium", tiempo: "35 min", categoria: "Drinks",
        video: "videos/atol_de_elote.mp4",
        desc: "A creamy, smooth sweet corn beverage served hot, highlighted by a sweet aroma of fresh cinnamon.", 
        ingredientes: ["6 ears of fresh sweet yellow corn", "2 cups milk", "1 cup water", "1 cinnamon stick", "Sugar"],
        pasos: [
            "Shuck the fresh ears of yellow corn, clean off all the silk threads, and use a sharp knife to carefully slice the sweet kernels off the cobs.",
            "Place the fresh corn kernels into a blender along with 1 cup of water, and blend on high speed for 2 minutes until completely liquefied.",
            "Pour the blended corn mixture through an extremely fine mesh sieve or a clean cheesecloth into a large cooking pot, squeezing hard to extract all the milk while discarding the starchy dry fiber solids.",
            "Add the whole milk, white sugar to taste, a pinch of salt, and a large cinnamon stick directly into the pot with the extracted corn liquid.",
            "Place the pot over medium-low heat and bring it to a gentle simmer.",
            "Stir the liquid constantly and continuously with a wooden spoon for 25 to 30 minutes without stopping, making sure it doesn't stick or burn on the bottom.",
            "Once the mixture thickens into a smooth, velvety, coating consistency, remove the cinnamon stick and ladle it hot into clay mugs."
        ]
    },
    { 
        id: 19, nombre: "Chicha Salvadoreña", dificultad: "difficult", tiempo: "7 days", categoria: "Drinks",
        video: "videos/chicha.mp4",
        desc: "Traditional fermented beverage crafted from corn, panela sugarcane, and assorted fruits like pineapple and ginger.", 
        ingredientes: ["2 lbs corn kernels", "2 blocks panela sugar", "1 pineapple rind", "Ginger root", "Water"],
        pasos: [
            "Toast the raw corn kernels lightly in a dry skillet over medium heat until they smell aromatic but are not popped or burnt.",
            "Coarsely crush the toasted corn kernels using a mortar or a rolling pin.",
            "Wash a whole ripe pineapple thoroughly, peel off the rough outer rind, and chop the rind into large pieces (you can save the fruit for eating).",
            "In a massive clay pot (tinaja) or a large glass jar, combine the crushed corn, the pineapple rinds, a smashed piece of fresh ginger root, and two whole blocks of panela sugarcane.",
            "Fill the container with 8 to 10 cups of clean water, stirring well until the panela begins to dissolve.",
            "Cover the mouth of the container tightly with a clean, breathable cotton cloth and tie it securely with a string to keep out dust while allowing gases to escape.",
            "Store the pot in a dark, warm, undisturbed place like a pantry for 5 to 7 days to ferment. Strain the deep amber liquid through a cloth, discard the solids, and serve the resulting chicha chilled over ice."
        ]
    },
    { 
        id: 20, nombre: "Horchata de Morro", dificultad: "medium", tiempo: "30 min", categoria: "Drinks",
        video: "videos/horchata.mp4",
        desc: "Refreshing iced drink made from ground morro seeds, mixed with cocoa, cinnamon, and peanuts.", 
        ingredientes: ["1 cup morro seeds", "1/4 cup cocoa beans", "1/2 cup peanuts", "1 cinnamon stick", "4 cups milk", "Sugar"],
        pasos: [
            "Heat a wide, dry skillet over medium-low heat. Add the raw morro seeds and toast them gently, stirring constantly for 5 minutes until they turn aromatic and slightly darker.",
            "Remove the morro seeds, then add the raw cocoa beans, peanuts, sesame seeds, and a broken cinnamon stick into the same hot skillet, toasting them until fragrant.",
            "Allow all the toasted seeds and spices to cool down completely on a plate.",
            "Transfer everything into a high-powered blender or a spice grinder and process for several minutes until it turns into a completely fine, dry, powdery flour.",
            "In a large pitcher, mix 4 tablespoons of this custom morro powder with 4 cups of ice-cold whole milk and 2 cups of water.",
            "Add white sugar and a tiny drop of vanilla essence, stirring vigorously until the sugar is fully dissolved.",
            "Pour the mixture through a very fine cloth strainer to catch any remaining gritty seed bits, and serve the smooth, spiced horchata in glasses packed with crushed ice."
        ]
    },
    { 
        id: 21, nombre: "Fresco de Ensalada", dificultad: "easy", tiempo: "15 min", categoria: "Drinks",
        video: "videos/ensalada.mp4",
        desc: "A super refreshing, highly popular fruit beverage chopped into microscopic bites. It features a sweet, tropical liquid base filled with tiny pieces of apples, pineapples, and watercress.", 
        ingredientes: ["1/2 cup finely minced red apple", "1/2 cup finely minced pineapple", "1/2 cup marañón juice base or pineapple juice", "Fresh mint or watercress leaves", "Sugar and ice"],
        pasos: [
            "Chop the red apple, fresh pineapple, and any other preferred local fruits into extremely small, microscopic cubes.",
            "In a large pitcher, blend your tropical fruit juice base with cold clean water and add sugar to your exact liking.",
            "Stir the tiny fruit cubes and a few drops of fresh lemon juice directly into the prepared juice mixture.",
            "Serve heavily chilled inside large glasses over plenty of crushed ice, garnished with a tiny clean leaf of fresh watercress or mint."
        ]
    },
    { 
        id: 22, nombre: "Chocos" , dificultad: "easy", tiempo: "15 min", categoria: "Sweets",
        video: "videos/chocobananos.mp4",
        desc: "The absolute favorite quick street treat for kids and adults across El Salvador. Frozen bananas dipped in a warm, crunchy chocolate shell coating.", 
        ingredientes: ["4 firm ripe bananas", "1 cup chocolate coating disc melts", "Wooden skewers or popsicles sticks"],
        pasos: [
            "Peel the firm bananas carefully and slice them in half crosswise to make two equal portions.",
            "Insert a wooden skewer or popsicle stick firmly into the flat cut end of each banana half, lay them on a tray, and freeze for at least 4 hours until solid.",
            "Melt the chocolate coating discs in a tall glass or microwave-safe bowl in short 30-second intervals, stirring until completely smooth.",
            "Take the frozen bananas out, dip them directly into the warm melted chocolate, rotate to cover entirely, and watch the coating freeze instantly into a crunchy shell."
        ]
    },
    { 
        id: 23, nombre: "Arroz con Leche", dificultad: "easy", tiempo: "25 min", categoria: "Sweets",
        video: "videos/arroz_con_leche.mp4",
        desc: "The ultimate comforting homemade dessert in Salvadoran households. Tender rice simmered with aromatic cinnamon sticks, rich whole milk, and a perfect touch of sweetness.", 
        ingredientes: ["1 cup white rice", "2 cups water", "1 cinnamon stick", "3 cups whole milk", "1/2 cup sugar", "Raisins to taste"],
        pasos: [
            "Combine the white rice, water, and the aromatic cinnamon stick in a medium saucepan and bring to a boil over medium-high heat.",
            "Reduce the heat to low, cover the saucepan tightly with a lid, and simmer for 12 minutes until the rice is tender and the water is completely absorbed.",
            "Pour in the whole milk and sugar, stirring gently with a wooden spoon to fully incorporate everything without breaking the rice grains.",
            "Simmer uncovered on low heat for about 10 minutes, stirring constantly to prevent sticking, until it thickens to your liking. Top with raisins and serve warm or chilled."
        ]
    },
    { 
        id: 24, nombre: "Atol Chuco", dificultad: "easy", tiempo: "30 min", categoria: "Drinks",
        video: "videos/atol_chuco.mp4",
        desc: "An ancestral and highly iconic fermented beverage from El Salvador. Made from quick-fermented purple corn masa, served hot with whole black beans, alguashte powder, and a touch of spice.", 
        ingredientes: ["2 cups purple or white corn flour", "4 cups water", "1/2 cup cooked whole black beans (with broth)", "3 tbsp alguashte powder (pumpkin seed powder)", "Lime and hot sauce to taste"],
        pasos: [
            "Thoroughly dissolve the purple corn flour into the cold water, making sure to break up any lumps until completely smooth.",
            "Strain the mixture through a fine sieve into a deep pot, then cook over medium heat, stirring continuously with a wooden spoon.",
            "Once it reaches a boil and thickens into a smooth, silky texture, remove from heat (it will naturally carry a pleasant, signature sour note).",
            "Pour hot into a traditional morro gourd (huacal), top with a generous spoonful of warm black beans, sprinkle alguashte powder on top, and add lime or hot sauce to taste."
        ]
    },
    { 
        id: 25, nombre: "Torrejas Salvadoreñas", dificultad: "easy", tiempo: "25 min", categoria: "Sweets",
        video: "videos/torrejas.mp4",
        desc: "The star dessert during Holy Week and traditional afternoons. Spongy egg-yolk bread coated in a fluffy egg batter, fried to perfection, and drenched in a rich panela sugarcane syrup.", 
        ingredientes: ["1 pan de yema (egg-yolk bread loaf)", "3 large eggs", "1 block panela sugar", "1 cup water", "1 cinnamon stick", "Oil for frying"],
        pasos: [
            "Prepare the syrup by placing the panela sugar blocks, water, and a cinnamon stick in a pot. Boil over medium heat until completely dissolved into a light amber syrup.",
            "Slice the pan de yema loaf crosswise into thick slices of about 2 centimeters.",
            "Separate the egg whites from the yolks into a clean bowl, whip whites to stiff peaks, then gently fold the yolks back in with a tiny pinch of salt.",
            "Dip each bread slice into the fluffy egg batter to coat completely, fry in hot oil for 1-2 minutes per side until golden brown, and submerge them directly into the warm panela syrup."
        ]
    }
];

// 2. Carousel, Hero & Grid Toggles
const imagenesConfig = {
    platoHero: "/assets/img/TypicalRecipes/chilaquilas.jpg",
    fondosHero: [
        "/assets/img/TypicalRecipes/Fresco de Cebada.jpg",
        "/assets/img/TypicalRecipes/pan hero.jpg",
        "/assets/img/TypicalRecipes/Pupusas Salvadoreñas.jpg",
        "/assets/img/TypicalRecipes/Sopa de pata hero.jpg" 
    ]
};

let currentBgIndex = 0;
let bgInterval;
let activeRecipeId = null; 
let imagenesRecetas = {};

function scrollToRecipes() {
    const section = document.querySelector('.recipes-carousel-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function changeHeroBg(index) {
    currentBgIndex = index;
    const hero = document.getElementById('heroSlider');
    const dots = document.querySelectorAll('#heroDots .dot');
    if(hero) hero.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${imagenesConfig.fondosHero[currentBgIndex]}')`;
    dots.forEach(dot => dot.classList.remove('active'));
    if(dots[currentBgIndex]) dots[currentBgIndex].classList.add('active');
}

function autoRotateHero() {
    currentBgIndex = (currentBgIndex + 1) % imagenesConfig.fondosHero.length;
    changeHeroBg(currentBgIndex);
}

function manualBgChange(index) {
    clearInterval(bgInterval);
    changeHeroBg(index);
    bgInterval = __interval(autoRotateHero, 6000);
}

function spinPlate() {
    const plate = document.getElementById('rotatingPlate');
    if(plate) plate.style.transform = plate.style.transform === "rotate(360deg)" ? "rotate(0deg)" : "rotate(360deg)";
}

let showingAllGrid = false;
function showAllRecipesExtended(recetasFiltradas = baseRecetas) {
    const carouselWrapper = document.getElementById('carouselWrapper');
    const allRecipesGrid = document.getElementById('allRecipesGrid');
    const container = document.getElementById('gridContainer');
    const toggleBtn = document.getElementById('toggleViewBtn');

   if (!showingAllGrid) {
    container.innerHTML = "";
    recetasFiltradas.forEach(recipe => {
        const imgUrl = imagenesRecetas[recipe.id] || imagenesConfig.platoHero;

        container.innerHTML += `
            <div class="recipe-card" style="animation: fadeIn 0.4s ease-in-out;">
                <div class="card-img" style="background-image: url('${imgUrl}')">
                    <span class="card-badge" style="background: var(--accent-gold);">${recipe.categoria}</span>
                </div>
                <div class="card-body">
                    <span style="font-size:0.75rem; color:var(--accent-gold); font-weight:700; text-transform:uppercase;">⏱️ ${recipe.tiempo} | ${recipe.dificultad}</span>
                    <h4 style="margin-top:5px;">${recipe.nombre}</h4>
                    <p>${recipe.desc}</p>
                    <div class="card-footer">
                        <button class="btn-cook" onclick="openModal(${recipe.id})">View Full Recipe</button>
                    </div>
                </div>
            </div>
        `;
    });

        if(carouselWrapper) carouselWrapper.style.display = "none";
        if(allRecipesGrid) allRecipesGrid.style.display = "block";
        if(toggleBtn) toggleBtn.innerText = "Back to Showcase";
        showingAllGrid = true;
    } else {
        if(allRecipesGrid) allRecipesGrid.style.display = "none";
        if(carouselWrapper) carouselWrapper.style.display = "flex";
        if(toggleBtn) toggleBtn.innerText = "View all recipes";
        showingAllGrid = false;
    }
}

function loadCarousel() {
    const track = document.getElementById('carouselTrack');
    if(!track) return;
    track.innerHTML = "";
    
    baseRecetas.slice(0, 6).forEach(recipe => {
        const imgUrl = imagenesRecetas[recipe.id] || imagenesConfig.platoHero;

        track.innerHTML += `
            <div class="recipe-card">
                <div class="card-img" style="background-image: url('${imgUrl}')">
                    <span class="card-badge">${recipe.tiempo}</span>
                </div>
                <div class="card-body">
                    <h4>${recipe.nombre}</h4>
                    <p>${recipe.desc.substring(0, 85)}...</p>
                    <div class="card-footer">
                        <button class="btn-cook" onclick="openModal(${recipe.id})">Cook Now</button>
                    </div>
                </div>
            </div>
        `;
    });
}

let currentPosition = 0;
function moveCarousel(direction) {
    const track = document.getElementById('carouselTrack');
    const cards = document.querySelectorAll('.recipe-card');
    if(!track || cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth + 20; 
    const maxScroll = track.scrollWidth - track.parentElement.offsetWidth;

    currentPosition += direction * cardWidth;
    if (currentPosition < 0) currentPosition = 0;
    if (currentPosition > maxScroll) currentPosition = maxScroll;

    track.style.transform = `translateX(-${currentPosition}px)`;
}

function loadChallengeLists() {
    const categories = ['easy', 'medium', 'difficult'];
    categories.forEach(cat => {
        const container = document.getElementById(`list-${cat}`);
        if (!container) return;
        container.innerHTML = "";
        
        const filtered = baseRecetas.filter(r => r.dificultad === cat);
        filtered.slice(0, 3).forEach(recipe => {
            const imgUrl = imagenesRecetas[recipe.id] || imagenesConfig.platoHero;

            container.innerHTML += `
                <div class="mini-item" onclick="openModal(${recipe.id})" style="cursor:pointer;">
                    <div class="mini-img" style="background-image: url('${imgUrl}')"></div>
                    <div class="mini-info">
                        <h5>${recipe.nombre}</h5>
                        <span>⏱️ ${recipe.tiempo}</span>
                    </div>
                </div>
            `;
        });
    });
}

function openModal(id) {
    const recipe = baseRecetas.find(r => r.id === id);
    if (!recipe) return;
    
    activeRecipeId = id; 
    
    const modal = document.getElementById('recipeModal');
    const body = document.getElementById('modalBody');
    if (!modal || !body) return;
    
    const imgUrl = imagenesRecetas[recipe.id] || imagenesConfig.platoHero;
    let ingredientsList = recipe.ingredientes.map(ing => `<li>${ing}</li>`).join('');
    let stepsList = recipe.pasos.map(step => `<li>${step}</li>`).join('');

    // Validar si la receta incluye video local descargado
    let videoHTML = '';
    if (recipe.video) {
        videoHTML = `
            <div class="modal-section-title">VIDEO TUTORIAL</div>
            <div style="width: 100%; border-radius: 12px; overflow: hidden; margin-top: 15px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-color: #000;">
                <video 
                    src="${recipe.video}" 
                    controls 
                    preload="none" 
                    playsinline
                    style="width: 100%; display: block; max-height: 360px; object-fit: contain;">
                    Tu navegador no soporta la reproducción de video.
                </video>
            </div>
        `;
    }

    body.innerHTML = `
        <div style="background-image: url('${imgUrl}'); height: 220px; background-size:cover; background-position:center; border-radius:12px; margin-bottom:15px;"></div>
        <h3 style="color:var(--dark-teal); font-size:1.6rem; margin-bottom:5px;">${recipe.nombre}</h3>
        <div style="margin-bottom:15px;">
            <span style="background:var(--accent-gold); color:white; padding:4px 14px; border-radius:20px; font-size:0.8rem; font-weight:bold; text-transform:uppercase;">${recipe.categoria}</span>
            <span style="margin-left:10px; color:#555; font-size:0.9rem; font-weight:600;">⏱️ Time: ${recipe.tiempo}</span>
        </div>
        <p style="color:#555; font-style:italic; margin-bottom:15px; line-height:1.5;">${recipe.desc}</p>
        
        <div class="modal-section-title">INGREDIENTS</div>
        <ul class="modal-list">${ingredientsList}</ul>
        
        <div class="modal-section-title">DIRECTIONS</div>
        <ol class="modal-list">${stepsList}</ol>
        
        ${videoHTML} 
    `;
    
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById('recipeModal');
    if(modal) {
        modal.style.display = "none";
        const body = document.getElementById('modalBody');
        if (body) body.innerHTML = ""; // Al limpiar el contenido detenemos por completo cualquier descarga y reproducción activa
    }
    activeRecipeId = null;
}

function filterDifficulty(difficulty) {
    const filtered = baseRecetas.filter(r => r.dificultad === difficulty);
    showingAllGrid = false; 
    showAllRecipesExtended(filtered);
    
    const gridSection = document.getElementById('allRecipesGrid');
    if(gridSection) gridSection.scrollIntoView({ behavior: 'smooth' });
}

function cargarImagenesDesdeHTML() {
    const contenedorImagenes = document.getElementById('htmlRecipeImages');
    if (!contenedorImagenes) return;
    
    const imagenes = contenedorImagenes.getElementsByTagName('img');
    for (let img of imagenes) {
        const id = img.getAttribute('data-img-id');
        const src = img.getAttribute('src');
        imagenesRecetas[id] = (src && src.trim() !== "" && src !== "img/") ? src : imagenesConfig.platoHero;
    }
}

const misFondosHero = [
    "img/Fresco de Cebada.jpg",
    "img/pan hero.jpg",
    "img/Pupusas Salvadoreñas.jpg ",
    "img/Sopa de pata hero.jpg"
];

let miHeroIndex = 0;

function rotarFondoHeroAutomatico() {
    const heroSection = document.getElementById('heroSlider');
    if (!heroSection) return;
    
    miHeroIndex = (miHeroIndex + 1) % misFondosHero.length;
    heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${misFondosHero[miHeroIndex]}')`;
}

__onload = () => {
    cargarImagenesDesdeHTML();

    const hero = document.getElementById('heroSlider');
    if(hero) hero.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${imagenesConfig.fondosHero[0]}')`;
    
    const plate = document.getElementById('rotatingPlate');
    if(plate) plate.style.backgroundImage = `url('${imagenesConfig.platoHero}')`;
    
    loadCarousel();
    loadChallengeLists();
    
    bgInterval = __interval(autoRotateHero, 6000);
};

window.onclick = function(event) {
    const modal = document.getElementById('recipeModal');
    if (event.target === modal) {
        closeModal();
    }
};

// ==========================================================================
// 3. EVENTOS CARGADOS AL INICIALIZAR EL DOCUMENTO (CARRUSEL Y MENÚ MÓVIL)
// ==========================================================================
/* [migración] listener del carrusel de main.js eliminado */

__ready( () => {
    // Inicializar carrusel y auto-play
    updateRotativeCarousel();
    startAutoPlay();

    // Configuración del Menú de Navegación Móvil (Hamburguesa)
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        navLinks?.classList.toggle('active');
        
        // Cambia el icono de barras (☰) a una equis (✕) al estar abierto
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    // Cierra el menú automáticamente si tocas cualquier parte fuera de él
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
  if (typeof closeModal !== 'undefined') __expose('closeModal', closeModal);
  if (typeof filterDifficulty !== 'undefined') __expose('filterDifficulty', filterDifficulty);
  if (typeof moveCarousel !== 'undefined') __expose('moveCarousel', moveCarousel);
  if (typeof scrollToRecipes !== 'undefined') __expose('scrollToRecipes', scrollToRecipes);
  if (typeof showAllRecipesExtended !== 'undefined') __expose('showAllRecipesExtended', showAllRecipesExtended);
  if (typeof spinPlate !== 'undefined') __expose('spinPlate', spinPlate);
if (typeof __onload === "function") __ready(__onload);
