/**
 * Artifact Information Sidebar
 *
 * Displays educational information about discovered artifacts.
 * Shows artifact name, description, historical context, and archaeological significance.
 */

const ARTIFACT_INFO = {
  // Valuable artifacts
  amphora: {
    name: 'Amphora',
    icon: '🏺',
    period: '8th century BCE - 3rd century CE',
    origin: 'Mediterranean Basin',
    description: 'A large ceramic vessel with two handles and a narrow neck, designed for transporting and storing liquids.',
    historicalContext: 'Amphorae were the shipping containers of the ancient world. Romans transported wine, olive oil, fish sauce (garum), and grain across the Mediterranean in these sturdy vessels. The shape varied by region and contents.',
    archaeologicalSignificance: 'Amphorae are invaluable for dating sites and tracing ancient trade routes. Stamps on handles often identify the producer, origin, and date. Shipwrecks containing amphorae have revealed the vast scale of Roman commerce.',
    funFact: 'A single Roman merchant ship could carry over 10,000 amphorae. The Monte Testaccio in Rome is an artificial hill made entirely of broken amphorae—estimated at 53 million vessels!'
  },
  denarius_coin: {
    name: 'Denarius Coin',
    icon: '🪙',
    period: '211 BCE - 3rd century CE',
    origin: 'Roman Republic/Empire',
    description: 'A small silver coin that served as the standard Roman currency for over four centuries.',
    historicalContext: 'The denarius was the backbone of Roman economy. A legionary soldier earned about 225 denarii per year under Augustus. The coin\'s silver content gradually decreased as emperors debased the currency to fund military campaigns.',
    archaeologicalSignificance: 'Coins are excellent dating tools since emperors changed portraits and inscriptions. Coin hoards reveal economic instability—people buried money during crises and never returned. Distribution patterns show trade networks.',
    funFact: 'The word "denarius" evolved into "denier" in France, "dinero" in Spain, and "dinar" in the Middle East—all still used today!'
  },
  mosaic_tile: {
    name: 'Mosaic Tile (Tessera)',
    icon: '🎨',
    period: '3rd century BCE - 6th century CE',
    origin: 'Roman Villas & Public Buildings',
    description: 'Small colored stone, glass, or ceramic cubes used to create decorative floor and wall images.',
    historicalContext: 'Mosaics adorned the floors of wealthy Roman homes, public baths, and temples. Designs ranged from geometric patterns to elaborate mythological scenes. Master mosaicists were highly valued artisans.',
    archaeologicalSignificance: 'Mosaics often survive when other decorations perish, providing insights into Roman art, mythology, and daily life. The subjects depicted—hunting scenes, gods, sea creatures—reveal cultural values and beliefs.',
    funFact: 'Roman mosaics used millions of tiny tesserae. The Alexander Mosaic from Pompeii contains approximately 1.5 million pieces and took years to create!'
  },
  oil_lamp: {
    name: 'Oil Lamp',
    icon: '🪔',
    period: '1st century BCE - 4th century CE',
    origin: 'Throughout Roman Empire',
    description: 'A terra cotta vessel that burned olive oil with a wick to provide light after sunset.',
    historicalContext: 'Before electricity, oil lamps were essential for extending productive hours into the night. Romans placed them in niches, hung them from chains, or carried them through streets. Workshops mass-produced standardized designs.',
    archaeologicalSignificance: 'Lamp styles changed frequently, making them useful for dating. Relief decorations on lamps show gods, gladiators, erotic scenes, and daily activities—a window into popular culture and beliefs.',
    funFact: 'Roman lamps were so common that archaeologists sometimes find them by the hundreds at single sites. The town of Modena, Italy produced millions of lamps for export!'
  },
  fibula: {
    name: 'Fibula (Brooch)',
    icon: '📎',
    period: '2nd millennium BCE - Medieval period',
    origin: 'Indo-European cultures',
    description: 'An ornate bronze or precious metal clasp used to fasten garments, similar to a modern safety pin.',
    historicalContext: 'Fibulae were both functional and decorative, showing the wearer\'s status and cultural identity. Styles evolved rapidly, with regional variations marking ethnic and social boundaries. Military fibulae identified legion membership.',
    archaeologicalSignificance: 'Fibula styles changed so frequently that archaeologists use them as precise dating markers. Their distribution reveals migration patterns, trade connections, and cultural exchange between Roman and "barbarian" peoples.',
    funFact: 'The fibula mechanism—a pin with a catch—was so effective that the modern safety pin, patented in 1849, uses essentially the same design invented 3,000 years earlier!'
  },
  strigil: {
    name: 'Strigil',
    icon: '🥄',
    period: '6th century BCE - 4th century CE',
    origin: 'Greek & Roman Bath Culture',
    description: 'A curved bronze blade used to scrape oil, sweat, and dirt from the skin during bathing rituals.',
    historicalContext: 'Romans didn\'t use soap—they applied olive oil, exercised to work up a sweat, then scraped themselves clean with strigils. Public baths were social centers where citizens of all classes mingled. Attendants often performed this service.',
    archaeologicalSignificance: 'Strigils found in graves indicate the deceased\'s participation in athletic or bath culture. Sets of strigils with oil flasks (aryballoi) suggest the owner\'s social status and cultural sophistication.',
    funFact: 'The scrapings from famous athletes—their oil, sweat, and skin cells—were collected and sold as medicine! Fans believed these "gloios" had healing properties.'
  },
  signet_ring: {
    name: 'Signet Ring',
    icon: '💍',
    period: 'Throughout antiquity',
    origin: 'Mediterranean Civilizations',
    description: 'A ring featuring a carved gemstone or metal bezel used to seal documents and mark ownership.',
    historicalContext: 'Signet rings served as personal identification in a world without signatures. Pressing the carved design into hot wax authenticated letters and legal documents. Designs featured family symbols, gods, or personal mottos.',
    archaeologicalSignificance: 'Signet rings can sometimes identify specific individuals, especially from elite families. The carved images reveal personal beliefs, family traditions, and artistic preferences of their owners.',
    funFact: 'Julius Caesar\'s signet ring bore an image of Venus, claiming descent from the goddess. Augustus later used a sphinx, then Alexander the Great\'s portrait, before settling on his own image!'
  },
  fresco_fragment: {
    name: 'Fresco Fragment',
    icon: '🖼️',
    period: '2nd century BCE - 4th century CE',
    origin: 'Roman Domestic Architecture',
    description: 'A piece of painted wall plaster showing pigments applied to wet lime plite.',
    historicalContext: 'Wealthy Romans decorated their homes with elaborate wall paintings depicting gardens, architecture, mythological scenes, and portraits. Styles evolved through four distinct periods, from simple patterns to complex illusionistic scenes.',
    archaeologicalSignificance: 'Frescoes reveal Roman color preferences, artistic techniques, and cultural values. Pompeii\'s preservation provided an unparalleled window into Roman painting that would otherwise be almost entirely lost.',
    funFact: 'Roman painters used expensive pigments like Egyptian blue and cinnabar red. The deep red color common in Pompeian frescoes required mercury ore imported from Spain!'
  },
  gladius_pommel: {
    name: 'Gladius Pommel',
    icon: '⚔️',
    period: '3rd century BCE - 3rd century CE',
    origin: 'Roman Military',
    description: 'The decorative end-cap of a Roman short sword handle, often made of wood, bone, or metal.',
    historicalContext: 'The gladius was the iconic weapon of Roman legions—a short, double-edged sword optimized for close combat. The pommel balanced the blade and secured the grip. Decorated pommels indicated rank or unit.',
    archaeologicalSignificance: 'Military equipment helps identify garrison locations and troop movements. Gladius finds outside the empire reveal trade, diplomacy, or conflict with neighboring peoples.',
    funFact: 'The gladius was so effective that Rome conquered the Mediterranean world with it. The word "gladiator" comes from gladius—these fighters were literally "swordsmen."'
  },
  votive_statue: {
    name: 'Votive Statue',
    icon: '🗿',
    period: 'Throughout antiquity',
    origin: 'Religious Sanctuaries',
    description: 'A small figurine offered to the gods at temples and shrines as a prayer or thanksgiving.',
    historicalContext: 'Romans left votive offerings to request divine favor or thank gods for answered prayers. Statues might represent the deity, the worshipper, or the desired outcome—healed body parts were common medical votives.',
    archaeologicalSignificance: 'Votive deposits reveal popular religious practices often unmentioned in elite literature. The types of offerings show what ordinary people prayed for: health, fertility, safe travel, and business success.',
    funFact: 'Some Roman temples accumulated so many votives they had to periodically bury the excess in sacred pits. These "votive dumps" are archaeological treasure troves!'
  },

  // Junk items
  broken_pottery: {
    name: 'Pottery Shard',
    icon: '💔',
    period: 'Various',
    origin: 'Common Household Ware',
    description: 'A fragment of broken ceramic vessel, too damaged to identify its original form.',
    historicalContext: 'Pottery was everywhere in the ancient world—for cooking, storage, eating, and drinking. When vessels broke, the pieces were discarded. These mundane fragments accumulated in massive quantities.',
    archaeologicalSignificance: 'Even unidentifiable sherds help date soil layers and indicate human activity. Pottery analysis (fabric, temper, firing technique) can reveal local production or trade connections.',
    funFact: 'Archaeologists joke that pottery is their best friend and worst enemy—it\'s everywhere, never decays, and takes forever to analyze!'
  },
  corroded_nail: {
    name: 'Corroded Nail',
    icon: '📍',
    period: 'Iron Age onward',
    origin: 'Construction & Woodworking',
    description: 'A heavily oxidized iron fastener, its original shape obscured by rust.',
    historicalContext: 'Iron nails were essential for Roman construction—buildings, ships, furniture, and carts all required thousands of nails. Blacksmiths produced them in standardized sizes for different purposes.',
    archaeologicalSignificance: 'Nail concentrations indicate wooden structures that have decayed. The size and style of nails can suggest what was built there—a house, warehouse, or ship.',
    funFact: 'When the Roman army abandoned forts, they sometimes buried millions of nails to deny them to enemies. The Inchtuthil hoard in Scotland contained 875,000 unused nails—7 tons of iron!'
  },
  stone_fragment: {
    name: 'Stone Fragment',
    icon: '🪨',
    period: 'Various',
    origin: 'Building Construction',
    description: 'A broken piece of worked stone, likely from a collapsed building or monument.',
    historicalContext: 'Romans were master builders who constructed in stone throughout their empire. When buildings collapsed or were demolished, the rubble was often reused or simply left in place.',
    archaeologicalSignificance: 'Stone fragments can reveal construction techniques and building types. Tool marks show how the stone was worked, while the stone type indicates quarry sources and trade patterns.',
    funFact: 'Romans recycled building materials constantly. Medieval churches throughout Europe contain Roman stones, columns, and inscriptions repurposed from ancient buildings!'
  },
  animal_bone: {
    name: 'Animal Bone',
    icon: '🦴',
    period: 'All periods',
    origin: 'Food Remains',
    description: 'A fragment of bone from a domesticated animal, likely discarded after a meal.',
    historicalContext: 'Romans ate beef, pork, lamb, goat, chicken, and game. Bones accumulated in trash pits, streets, and floors. Different cuts went to different social classes—the wealthy ate choice cuts while the poor got scraps.',
    archaeologicalSignificance: 'Animal bones reveal ancient diets, butchering practices, and animal husbandry. Cut marks show how meat was processed. Species ratios indicate economic conditions and cultural preferences.',
    funFact: 'Zooarchaeologists can identify species, age, sex, and even diseases from bone fragments. They\'ve discovered that Romans imported exotic animals like flamingos and dormice as luxury foods!'
  },
  weathered_brick: {
    name: 'Weathered Brick',
    icon: '🧱',
    period: '1st century BCE onward',
    origin: 'Roman Construction',
    description: 'A deteriorated clay building block, its surfaces worn smooth by centuries of exposure.',
    historicalContext: 'Romans perfected brick-making on an industrial scale. Standardized bricks built everything from humble houses to the Pantheon. Stamps on bricks often recorded the manufacturer, date, and imperial authority.',
    archaeologicalSignificance: 'Brick stamps are valuable dating tools—some record the exact year of production. Brick dimensions and compositions vary by region and period, helping identify construction phases.',
    funFact: 'The Romans made so many bricks that brick stamps form a continuous chronological record. Emperor Diocletian reorganized the brick industry, and we can track his reforms through changing stamp formats!'
  },

  // === Level 2 Artifacts: Roman Villa & Forum ===

  bronze_speculum: {
    name: 'Bronze Speculum',
    icon: '🪞',
    period: '1st - 4th century CE',
    origin: 'Roman Domestic Life',
    description: 'A polished bronze hand mirror with a decorated handle, used daily by Roman men and women.',
    historicalContext: 'Romans valued personal appearance highly. Both men and women used mirrors for grooming. Bronze mirrors were common; wealthier citizens owned silver or silver-plated versions. The reflective surface was created by polishing the metal to a high shine.',
    archaeologicalSignificance: 'Mirrors reveal Roman beauty standards and daily routines. Decorated handles show popular artistic motifs. Their widespread distribution demonstrates that personal grooming was important across social classes.',
    funFact: 'Glass mirrors backed with lead did exist in Roman times, but they produced poor reflections. Most Romans preferred the clearer image from polished bronze!'
  },
  garum_amphora: {
    name: 'Garum Amphora',
    icon: '🏺',
    period: '3rd century BCE - 5th century CE',
    origin: 'Mediterranean Fish Sauce Industry',
    description: 'A sealed vessel that once contained garum, the fermented fish sauce Romans used in nearly every dish.',
    historicalContext: 'Garum was the ketchup of the Roman world. Made by fermenting fish intestines and blood in the sun for months, this pungent sauce was added to almost everything. The finest garum from Pompeii cost more per liter than perfume.',
    archaeologicalSignificance: 'Garum amphorae are found across the Roman world, revealing the massive scale of fish sauce production and trade. Residue analysis can identify the fish species used and the sauce quality.',
    funFact: 'Despite sounding unappetizing, garum is essentially the ancestor of modern Worcestershire sauce and Asian fish sauces like nam pla!'
  },
  lead_curse_tablet: {
    name: 'Lead Curse Tablet (Defixio)',
    icon: '📜',
    period: '5th century BCE - 5th century CE',
    origin: 'Greco-Roman Magic Practices',
    description: 'A thin lead sheet inscribed with a curse intended to bind or harm an enemy through supernatural means.',
    historicalContext: 'Romans regularly used curse tablets to seek revenge, win lawsuits, or sabotage rivals. The inscriber would scratch the curse onto lead, fold it, pierce it with a nail, and deposit it in graves, wells, or temple precincts to reach the underworld gods.',
    archaeologicalSignificance: 'Curse tablets reveal everyday anxieties and conflicts that official records ignore. They document personal names, occupations, and social relationships while providing direct evidence of popular magical beliefs.',
    funFact: 'Over 1,600 curse tablets have been found. Common curses targeted chariot race opponents, legal adversaries, and love rivals. One tablet from Bath, England curses a thief who stole a bathing towel!'
  },
  terracotta_figurine: {
    name: 'Terracotta Figurine',
    icon: '🗿',
    period: '3rd century BCE - 4th century CE',
    origin: 'Roman Religious & Domestic Contexts',
    description: 'A small fired clay figure depicting a deity, person, or animal, used as a votive offering or household decoration.',
    historicalContext: 'Mass-produced from molds, terracotta figurines were affordable religious objects for common people. They depicted gods, goddesses, actors, animals, and everyday people. Households placed them in home shrines (lararia) for daily worship.',
    archaeologicalSignificance: 'Figurine types reveal popular religious devotion at a local level. Production centers and distribution patterns show economic networks. Mold similarities connect workshops across regions.',
    funFact: 'Roman children played with terracotta dolls that had movable arms and legs, attached with pins. Some have been found with tiny terracotta furniture and accessories!'
  },
  sestertius_coin: {
    name: 'Sestertius Coin',
    icon: '🪙',
    period: '3rd century BCE - 3rd century CE',
    origin: 'Roman Imperial Mint',
    description: 'A large bronze coin that was the standard unit of Roman accounting, worth one quarter of a denarius.',
    historicalContext: 'The sestertius was the coin most Romans handled daily. Prices in markets and rents were quoted in sestertii. Its large size allowed detailed portraits and elaborate reverse designs celebrating imperial achievements, buildings, and gods.',
    archaeologicalSignificance: 'Sestertii provide a rich visual record of Roman propaganda. Reverse designs show now-destroyed buildings, military victories, and political messages. Wear patterns indicate circulation duration.',
    funFact: 'The abbreviation HS for sestertius (from the old form IIS, two-and-a-half asses) is sometimes cited as an ancestor of the dollar sign $, though the exact connection is debated by scholars!'
  },
  roman_glass_vessel: {
    name: 'Roman Glass Vessel',
    icon: '🫗',
    period: '1st century BCE - 5th century CE',
    origin: 'Roman Glassblowing Industry',
    description: 'A delicate blown glass container displaying the iridescent patina of centuries of burial.',
    historicalContext: 'The invention of glassblowing around 50 BCE revolutionized Roman industry. What was once a luxury became affordable for ordinary people. Roman glass came in every color and form: bottles, cups, plates, and decorative pieces.',
    archaeologicalSignificance: 'Roman glass demonstrates technological innovation and trade networks. Chemical analysis of glass composition can identify production centers. The iridescent weathering layer (patina) actually results from centuries of chemical interaction with soil.',
    funFact: 'Romans invented the first cage cups (diatreta) -- glass vessels with an outer decorative cage cut from a single thick blank. Only about 50 fragments survive, making them among the rarest ancient artifacts!'
  },
  pilum_tip: {
    name: 'Pilum Tip',
    icon: '🔱',
    period: '4th century BCE - 5th century CE',
    origin: 'Roman Military Equipment',
    description: 'The pyramidal iron head of a Roman javelin (pilum), designed to bend upon impact to disable enemy shields.',
    historicalContext: 'Every Roman legionary carried two pila. Before close combat, soldiers hurled these heavy javelins at the enemy. The soft iron shank would bend on impact, making the javelin impossible to throw back and weighing down the enemy shield.',
    archaeologicalSignificance: 'Pilum finds mark military camps, battle sites, and garrison locations. Design variations track tactical changes across centuries. Distribution maps reveal the extent of Roman military operations.',
    funFact: 'Julius Caesar reportedly ordered his soldiers to modify their pila before the Battle of Pharsalus so the shanks would bend more easily, making them even more effective against Pompey\'s troops!'
  },
  tegula_legion_stamp: {
    name: 'Tegula with Legion Stamp',
    icon: '🧱',
    period: '1st - 4th century CE',
    origin: 'Roman Military & Civilian Construction',
    description: 'A large flat roof tile bearing the impressed stamp of the Roman legion that manufactured it.',
    historicalContext: 'Roman legions produced their own building materials when stationed in permanent camps. Tiles were stamped with the legion number and sometimes the date and commanding officer. Civilian tile works also stamped their products for quality control.',
    archaeologicalSignificance: 'Legion-stamped tiles are invaluable for identifying which military units were stationed where and when. They reveal the extent of military involvement in construction and the organization of Roman supply chains.',
    funFact: 'Roman soldiers did not just fight wars. Legionaries built roads, bridges, aqueducts, and entire cities. A legionary spent more time with a trowel than a sword!'
  },
  roof_tile_fragment: {
    name: 'Roof Tile Fragment',
    icon: '🧱',
    period: 'Various',
    origin: 'Roman Construction',
    description: 'A broken piece of terracotta roof tile, common debris from collapsed Roman buildings.',
    historicalContext: 'Roman roofs used two types of tiles: flat tegulae and curved imbrices. These interlocking tiles created a waterproof surface that lasted centuries. Broken tiles were often reused as building fill or floor material.',
    archaeologicalSignificance: 'Tile fragments indicate the presence of Roman-style buildings. Fabric analysis reveals local clay sources and production methods. Thick accumulations of tile mark collapsed roofs.',
    funFact: 'Romans sometimes wrote graffiti on wet tiles before firing. Messages range from workers counting production to love notes and rude comments about supervisors!'
  },
  iron_slag: {
    name: 'Iron Slag',
    icon: '⚫',
    period: 'Iron Age onward',
    origin: 'Metalworking & Smithing',
    description: 'Glassy waste material produced during iron smelting or smithing operations.',
    historicalContext: 'Every Roman settlement needed blacksmiths to produce and repair tools, weapons, nails, and household items. The smelting and forging process produced large quantities of slag that accumulated near workshops.',
    archaeologicalSignificance: 'Slag deposits indicate industrial zones within settlements. Chemical analysis reveals smelting temperatures and ore sources. The quantity of slag helps estimate production scale.',
    funFact: 'Roman ironworkers could achieve temperatures over 1200 degrees Celsius in their furnaces. Some slag contains tiny droplets of iron that never made it into the final product!'
  },
  charcoal_remnants: {
    name: 'Charcoal Remnants',
    icon: '⚫',
    period: 'All periods',
    origin: 'Cooking & Heating',
    description: 'Carbonized wood fragments from a Roman hearth, hypocaust, or cooking fire.',
    historicalContext: 'Wood and charcoal were the primary fuels of the Roman world. Cooking, heating baths, firing pottery, and smelting metal all required enormous quantities of fuel. Deforestation around major cities was a real environmental consequence.',
    archaeologicalSignificance: 'Charcoal fragments can be identified to tree species, revealing ancient woodland composition and fuel preferences. Radiocarbon dating of charcoal provides absolute dates for archaeological layers.',
    funFact: 'Romans burned so much wood heating their baths that some towns had officials specifically tasked with managing fuel supplies. The baths of Caracalla in Rome required an estimated 10 tons of wood per day!'
  },

  // === Level 4: Volcanic Ruins (Pompeii-style) ===

  plaster_body_cast: {
    name: 'Plaster Body Cast',
    icon: '🗿',
    period: '79 CE (preserved)',
    origin: 'Pompeii / Herculaneum',
    description: 'A plaster cast created by pouring liquid plaster into the void left by a victim\'s decomposed body in hardened volcanic ash.',
    historicalContext: 'When Mount Vesuvius erupted in 79 CE, layers of ash buried the cities of Pompeii and Herculaneum. As victims\' bodies decomposed, they left hollow cavities in the solidified ash. In 1863, archaeologist Giuseppe Fiorelli pioneered the technique of filling these voids with plaster.',
    archaeologicalSignificance: 'Body casts reveal the final moments of eruption victims—their poses, clothing, and even facial expressions. They provide invaluable data about Roman physiology, health, and the eruption\'s timeline.',
    funFact: 'Modern archaeologists now use clear resin instead of plaster, allowing CT scans to reveal bones, teeth, and even stomach contents inside the casts without breaking them open!'
  },
  carbonized_bread: {
    name: 'Carbonized Bread Loaf',
    icon: '🍞',
    period: '79 CE (preserved)',
    origin: 'Pompeii Bakeries',
    description: 'A round loaf of bread carbonized but perfectly preserved by the extreme heat of the eruption.',
    historicalContext: 'Pompeii had over 30 commercial bakeries (pistrina) that served the city\'s 11,000 residents. Bakers used large stone mills powered by donkeys to grind flour, then baked loaves in wood-fired ovens. The distinctive scored pattern on loaves made them easy to tear into portions.',
    archaeologicalSignificance: 'Carbonized food remains reveal Roman diet, baking techniques, and grain varieties. Analysis shows Pompeian bread was made from coarsely-ground wheat, sometimes mixed with other grains.',
    funFact: 'One famous carbonized loaf from Pompeii still bears its baker\'s stamp: "Made by Celer, slave of Quintus Granius Verus." It was found in an oven, ready for a delivery that never happened!'
  },
  thermopolium_pot: {
    name: 'Thermopolium Pot',
    icon: '🍲',
    period: '1st century CE',
    origin: 'Pompeii Street Kitchens',
    description: 'A large terracotta vessel (dolium) sunk into the marble counter of a Roman fast-food establishment.',
    historicalContext: 'Thermopolia were ancient fast-food restaurants where Romans bought ready-to-eat hot meals. Most Pompeians lived in small apartments without kitchens and ate most meals at these counters. Pompeii had around 150 thermopolia serving stews, lentils, and wine.',
    archaeologicalSignificance: 'Residue analysis of thermopolium pots reveals the actual recipes Romans ate daily—duck, goat, pork, fish, snails, and beans have all been identified. They show the diverse, multicultural diet of ordinary Romans.',
    funFact: 'A beautifully preserved thermopolium discovered in Pompeii in 2019 still had food residue in its pots and even contained the remains of a tiny dog under the counter—possibly a pet that sheltered there during the eruption!'
  },
  garden_fresco_panel: {
    name: 'Garden Fresco Panel',
    icon: '🎨',
    period: '1st century CE',
    origin: 'Pompeii Domestic Villas',
    description: 'A vibrant wall painting depicting an idealized Roman garden with birds, flowers, and fountains.',
    historicalContext: 'Wealthy Pompeians decorated their homes with elaborate frescoes that created the illusion of expanded space. Garden scenes (viridaria) were especially popular, bringing the outdoors inside. Artists worked quickly, painting onto fresh wet plaster before it dried.',
    archaeologicalSignificance: 'Pompeian frescoes are classified into four distinct styles spanning 200 years. They reveal Roman artistic techniques, color pigments, plant species, bird species, and ideals of beauty and nature.',
    funFact: 'The vivid "Pompeii red" seen in many frescoes was originally bright yellow ochre that turned red when heated by the eruption! Romans actually preferred the original yellow color.'
  },
  marble_venus_statue: {
    name: 'Marble Venus Statue',
    icon: '🏛️',
    period: '1st century CE',
    origin: 'Pompeii Religious Sites',
    description: 'A small marble statuette of Venus, the patron goddess of Pompeii.',
    historicalContext: 'Venus was the special protector of Pompeii—the city\'s official name was Colonia Cornelia Veneria Pompeianorum. Her temples and images were found throughout the city. Venus represented love, beauty, and prosperity.',
    archaeologicalSignificance: 'Statuary reveals Roman sculptural techniques, religious devotion patterns, and the importance of patron deities to civic identity. Marble analysis can trace the stone to specific quarries across the Empire.',
    funFact: 'When Pompeii was first excavated in the 1700s, many Venus statues were considered too risqué for public display and were locked away in the "Secret Cabinet" of the Naples Museum, accessible only with special permission!'
  },
  lararium_shrine: {
    name: 'Lararium Shrine',
    icon: '⛩️',
    period: '1st century CE',
    origin: 'Pompeii Households',
    description: 'A small household altar where Romans worshipped their protective household spirits (Lares).',
    historicalContext: 'Every Roman home had a lararium—a shrine to the Lares (household guardian spirits) and Penates (pantry gods). Families made daily offerings of food, wine, and incense. The lararium was the spiritual heart of Roman domestic life.',
    archaeologicalSignificance: 'Lararia reveal private Roman religious practices that differ from formal state religion. Their paintings and statuettes show which gods individual families favored and how worship was integrated into daily routines.',
    funFact: 'Some Pompeian lararia included paintings of snakes—not because Romans feared them, but because snakes were considered good luck guardians of the home. They were the ancient equivalent of a lucky charm!'
  },
  volcanic_glass_cameo: {
    name: 'Volcanic Glass Cameo',
    icon: '💎',
    period: '1st century CE',
    origin: 'Campanian Workshop',
    description: 'A portrait cameo carved from local obsidian (volcanic glass) with extraordinary fine detail.',
    historicalContext: 'The volcanic region around Vesuvius provided obsidian—a naturally occurring glass formed from rapidly cooling lava. Skilled gem-cutters (gemmarii) carved tiny portraits and mythological scenes into these stones, creating wearable art for the Roman elite.',
    archaeologicalSignificance: 'Cameos combine artistic value with geological information. The obsidian source can be traced through chemical analysis, revealing trade networks. Portrait cameos sometimes depict identifiable historical figures.',
    funFact: 'Obsidian is so sharp that its edges can be just a few molecules thick—sharper than surgical steel! Some modern surgeons use obsidian scalpels for delicate eye surgery because they make cleaner cuts.'
  },
  gold_bulla_amulet: {
    name: 'Gold Bulla Amulet',
    icon: '🏅',
    period: '1st century CE',
    origin: 'Pompeii Wealthy Households',
    description: 'A hollow gold locket worn around the neck by freeborn Roman boys as a protective charm.',
    historicalContext: 'The bulla was given to freeborn Roman boys at birth and worn until they came of age around 16, when it was dedicated to the household gods. It contained protective amulets against evil. Only children of citizens could wear the gold version—freedmen\'s children wore leather.',
    archaeologicalSignificance: 'Bullae indicate the presence of citizen families and help identify children\'s burials. Gold bullae signal considerable wealth. Some contain tiny objects believed to ward off the evil eye.',
    funFact: 'Roman girls wore a different amulet called a lunula (little moon) until their wedding day. When she married, a Roman bride would dedicate her childhood toys and lunula to the goddess Venus!'
  },
  ivory_dice_set: {
    name: 'Ivory Dice Set',
    icon: '🎲',
    period: '1st century CE',
    origin: 'Pompeii Gaming Houses',
    description: 'A pair of carved ivory dice used for gambling and board games in Roman leisure hours.',
    historicalContext: 'Romans were passionate gamblers. Dice games, board games, and betting on gladiatorial combat were hugely popular pastimes. Gambling was technically illegal in Rome except during Saturnalia, but the law was widely ignored—especially in Pompeii\'s taverns.',
    archaeologicalSignificance: 'Dice reveal manufacturing techniques and materials available. Some ancient dice are deliberately weighted, showing that cheating is as old as gambling itself. Gaming pieces help identify social gathering spaces.',
    funFact: 'Emperor Claudius was such an avid dice player that he wrote a book about dice games (now lost) and had a special gaming board fitted to his chariot so he could play while traveling!'
  },
  silver_mirror_pompeii: {
    name: 'Silver Hand Mirror',
    icon: '🪞',
    period: '1st century CE',
    origin: 'Pompeii Domestic Villas',
    description: 'A highly polished silver disc mirror with an ornately decorated handle, used for personal grooming.',
    historicalContext: 'Silver mirrors were luxury items in Roman households, owned by wealthy women for their daily grooming rituals. The reflective surface was created by polishing the metal to an extremely smooth finish. Mirrors were associated with Venus and feminine beauty.',
    archaeologicalSignificance: 'Metal mirrors indicate household wealth levels. Handle decorations reveal artistic styles and mythological preferences. The silver composition and craftsmanship help identify regional workshops and trade patterns.',
    funFact: 'Roman mirrors weren\'t nearly as reflective as modern glass mirrors—they produced a slightly blurred, warm-toned reflection. Romans also used mirrors to start fires by focusing sunlight, much like a magnifying glass!'
  },
  petrified_scroll: {
    name: 'Petrified Scroll',
    icon: '📜',
    period: '79 CE (preserved)',
    origin: 'Herculaneum Villa Library',
    description: 'A papyrus scroll carbonized by volcanic heat, preserving its text in a fragile charcoal-like state.',
    historicalContext: 'The Villa of the Papyri in Herculaneum contained an entire library of over 1,800 scrolls—the only intact library from antiquity. The volcanic heat carbonized the scrolls, preserving them but making them incredibly fragile and nearly impossible to unroll.',
    archaeologicalSignificance: 'These scrolls contain lost works of Epicurean philosophy, primarily by Philodemus of Gadara. Modern techniques including X-ray phase-contrast tomography can now read the text without unrolling the delicate scrolls.',
    funFact: 'In 2023, the Vesuvius Challenge used AI and CT scanning to read text inside an unopened Herculaneum scroll for the first time in 2,000 years—the word "purple" was the first to be deciphered!'
  },
  basalt_millstone: {
    name: 'Basalt Millstone',
    icon: '⚙️',
    period: '1st century CE',
    origin: 'Pompeii Bakeries',
    description: 'A large hourglass-shaped millstone carved from local volcanic basalt, used for grinding grain.',
    historicalContext: 'Pompeii\'s bakeries used distinctive hourglass-shaped mills (mola asinaria) made from local volcanic stone. Donkeys or slaves walked in circles pushing wooden beams that rotated the upper stone against the lower, grinding wheat into flour.',
    archaeologicalSignificance: 'Millstones reveal the scale of food production and the importance of bread in the Roman diet. The volcanic basalt\'s rough texture was ideal for grinding. Their locations help map commercial districts within ancient cities.',
    funFact: 'The rough, bubbly surface of volcanic basalt actually made better millstones than smooth granite—the tiny holes acted like natural graters! Pompeians were essentially grinding their bread with lava rock.'
  },
  embedded_bronze_valve: {
    name: 'Embedded Bronze Valve',
    icon: '🔧',
    period: '1st century CE',
    origin: 'Pompeii Water System',
    description: 'A sophisticated bronze stopcock valve from Pompeii\'s pressurized water distribution network, fused into volcanic rock.',
    historicalContext: 'Pompeii had an advanced water system fed by an aqueduct from the Serino springs 25 miles away. Bronze valves controlled water flow to public fountains, private homes, and baths. Only the wealthiest citizens had private water connections—the rest used public fountains.',
    archaeologicalSignificance: 'Bronze valves demonstrate sophisticated Roman engineering. Their placement maps the water distribution hierarchy—public needs first, then elite private connections. The engineering rivals some 19th-century plumbing technology.',
    funFact: 'Roman water engineers were so skilled that Pompeii\'s lead pipes had standardized bore sizes with official stamps. The water pressure was high enough to power decorative fountains that could shoot water several feet into the air!'
  },

  // Level 4 Junk
  volcanic_ash_clump: {
    name: 'Volcanic Ash Clump',
    icon: '🌋',
    period: '79 CE',
    origin: 'Mount Vesuvius',
    description: 'A compacted mass of gray volcanic tephra—fine rock fragments ejected during the eruption.',
    historicalContext: 'The eruption of Vesuvius produced two types of fallout: first a rain of pumice stones, then surges of superheated ash and gas (pyroclastic flows). The ash layers buried Pompeii under 4-6 meters of volcanic material.',
    archaeologicalSignificance: 'Ash layers help reconstruct eruption sequences and timing. Chemical analysis of tephra identifies specific eruptions. The ash preserved organic materials that would normally decompose, creating an unparalleled archaeological record.',
    funFact: 'Vesuvius ash was so fine it infiltrated every crack and crevice, which is why archaeologists find perfectly preserved impressions of wooden shutters, door frames, and even food on tables!'
  },
  charred_timber: {
    name: 'Charred Timber',
    icon: '🪵',
    period: '79 CE (preserved)',
    origin: 'Pompeii Construction',
    description: 'A piece of structural wood carbonized by the extreme heat of pyroclastic flows.',
    historicalContext: 'Roman buildings used timber extensively for roof beams, upper floors, balconies, and door frames. The pyroclastic flows that engulfed Pompeii reached temperatures over 300°C, hot enough to carbonize wood instantly while preserving its shape.',
    archaeologicalSignificance: 'Charred timbers reveal Roman construction techniques, wood species preferences, and carpentry joinery methods. Tree-ring dating (dendrochronology) of preserved wood can provide precise dating for building construction.',
    funFact: 'Herculaneum, Pompeii\'s neighbor, was buried by a deeper pyroclastic flow that actually preserved intact wooden furniture, beds, and even a baby\'s cradle—items almost never found at ancient sites!'
  },
  pumice_chunk: {
    name: 'Pumice Chunk',
    icon: '🪨',
    period: '79 CE',
    origin: 'Mount Vesuvius',
    description: 'A lightweight volcanic rock riddled with gas bubbles, formed when frothy lava cooled rapidly mid-eruption.',
    historicalContext: 'The first phase of the 79 CE eruption showered Pompeii with pumice stones for about 18 hours. The pumice fall accumulated at a rate of 15 centimeters per hour, collapsing roofs under its weight. Many victims were killed by falling roof beams.',
    archaeologicalSignificance: 'Pumice layers in the stratigraphic record mark volcanic events and help date archaeological sites across the Mediterranean. The size and composition of pumice fragments indicate distance from the eruption source.',
    funFact: 'Pumice is the only rock that floats on water! After the eruption, pumice from Vesuvius floated across the Bay of Naples. Romans used pumice stones to smooth their skin—ancient exfoliating scrubs!'
  },
  fused_coin_mass: {
    name: 'Fused Coin Mass',
    icon: '🪙',
    period: '79 CE (damaged)',
    origin: 'Pompeii Commerce',
    description: 'Several bronze and silver coins melted together by extreme pyroclastic heat into an unrecoverable mass.',
    historicalContext: 'Many Pompeians tried to flee with their valuables. Coin hoards found in homes and on victims show they grabbed what money they could. The extreme heat of pyroclastic flows (300-700°C) was hot enough to fuse bronze coins together.',
    archaeologicalSignificance: 'Fused coin masses demonstrate the extreme temperatures of pyroclastic flows. When individual coins can be identified, they help date the eruption and reveal denominations in circulation at the time.',
    funFact: 'One skeleton found near Pompeii\'s Herculaneum Gate was carrying a bag with over 1,000 sestertii—a fortune equal to several years\' wages for a laborer. The weight of the coins may have slowed their escape!'
  },
  hardened_mortar_lump: {
    name: 'Hardened Mortar Lump',
    icon: '🧱',
    period: '1st century CE',
    origin: 'Pompeii Construction',
    description: 'A chunk of Roman opus caementicium (concrete) fused with volcanic debris into an inseparable mass.',
    historicalContext: 'Roman concrete was made from volcanic ash (pozzolana), lime, and aggregate. Ironically, the same volcanic material that helped build Pompeii—pozzolanic ash from earlier eruptions—was the material that ultimately buried it.',
    archaeologicalSignificance: 'Roman concrete samples reveal construction techniques that produced structures lasting 2,000+ years. The volcanic ash component creates a chemical reaction with seawater that actually strengthens the concrete over time.',
    funFact: 'Roman concrete is stronger than modern Portland cement! Scientists discovered that seawater filtering through Roman harbor concrete creates aluminum tobermorite crystals that reinforce the material. We still can\'t fully replicate the recipe!'
  }
};

class ArtifactSidebar {
  constructor() {
    this.currentArtifact = null;
    this.sidebarElement = null;
    this.contentElement = null;
    this.initialized = false;
    this.displayTimeout = null;
  }

  /**
   * Creates and injects the sidebar DOM elements
   */
  initialize() {
    if (this.initialized) return;

    // Create sidebar container
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'artifact-sidebar';
    this.sidebarElement.innerHTML = `
      <div class="sidebar-header">
        <h2>Discovery</h2>
      </div>
      <div id="artifact-content" class="sidebar-content">
        <div class="artifact-placeholder">
          <p>Excavate artifacts to learn about Roman history and archaeology.</p>
        </div>
      </div>
    `;

    // Get the game wrapper and append sidebar after game container
    const gameWrapper = document.getElementById('game-wrapper');

    if (gameWrapper) {
      gameWrapper.appendChild(this.sidebarElement);
    } else {
      throw new Error('ArtifactSidebar: game-wrapper not found');
    }

    this.contentElement = document.getElementById('artifact-content');
    this.initialized = true;
  }

  /**
   * Shows artifact information when discovered
   * @param {string} artifactId - ID of the discovered artifact
   */
  showArtifact(artifactId) {
    if (!this.initialized) {
      this.initialize();
    }

    // Clear any pending timeout
    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
      this.displayTimeout = null;
    }

    this.currentArtifact = artifactId;
    const artifactInfo = ARTIFACT_INFO[artifactId];

    if (!artifactInfo) {
      console.warn('Unknown artifact:', artifactId);
      return;
    }

    // Add discovered class for animation
    this.sidebarElement.classList.add('artifact-discovered');

    // Remove animation class after animation completes
    setTimeout(() => {
      this.sidebarElement.classList.remove('artifact-discovered');
    }, 600);

    this.contentElement.innerHTML = `
      <div class="artifact-info">
        <div class="artifact-header">
          <span class="artifact-icon">${artifactInfo.icon}</span>
          <div class="artifact-title">
            <h3>${artifactInfo.name}</h3>
            <span class="artifact-period">${artifactInfo.period}</span>
          </div>
        </div>

        <div class="artifact-origin">
          <strong>Origin:</strong> ${artifactInfo.origin}
        </div>

        <p class="artifact-description">${artifactInfo.description}</p>

        <div class="info-section">
          <h4>Historical Context</h4>
          <p>${artifactInfo.historicalContext}</p>
        </div>

        <div class="info-section">
          <h4>Archaeological Significance</h4>
          <p>${artifactInfo.archaeologicalSignificance}</p>
        </div>

        <div class="info-section fun-fact">
          <h4>Did You Know?</h4>
          <p>${artifactInfo.funFact}</p>
        </div>
      </div>
    `;
  }

  /**
   * Clears the sidebar content
   */
  clear() {
    this.currentArtifact = null;
    if (this.contentElement) {
      this.contentElement.innerHTML = `
        <div class="artifact-placeholder">
          <p>Excavate artifacts to learn about Roman history and archaeology.</p>
        </div>
      `;
    }
  }

  /**
   * Resets sidebar for new level
   */
  reset() {
    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
      this.displayTimeout = null;
    }
    this.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ArtifactSidebar, ARTIFACT_INFO };
}
