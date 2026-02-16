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
