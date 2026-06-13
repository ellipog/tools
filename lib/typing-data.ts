export type PassageLength = "short" | "medium" | "long";
export type Status = "idle" | "typing" | "done";

export type HistoryEntry = {
  wpm: number;
  netWpm: number;
  accuracy: number;
  time: number;
  date: string;
  length?: PassageLength;
};

export const SHORT: string[] = [
  "The quick brown fox jumps over the lazy dog near the riverbank.",
  "A gentle breeze rustled the leaves on the old oak tree.",
  "She opened the book and began to read the first chapter eagerly.",
  "The train departed at noon from the central station platform.",
  "Pizza with extra cheese and pepperoni is my favorite meal.",
  "He placed the coffee mug on the wooden table carefully.",
  "The sun set behind the mountains painting the sky orange.",
  "They walked along the beach collecting seashells in a bag.",
  "Music played softly from the radio in the corner room.",
  "The cat stretched lazily on the warm windowsill this morning.",
  "Rain tapped against the glass as she read her novel.",
  "He rode his bicycle through the park on a sunny day.",
  "The chef prepared a delicious meal with fresh ingredients found.",
  "She wrote a letter to her friend who lived far away.",
  "The garden was full of colorful flowers blooming in spring.",
  "The old clock chimed twelve times at midnight last night.",
  "Fresh bread and butter made for a perfect breakfast this morning.",
  "The dog barked loudly at the mailman walking down the street.",
  "She picked a ripe apple from the tree in the backyard.",
  "Stars twinkled brightly in the clear night sky above.",
  "The teacher explained the math problem to the class slowly.",
  "He tied his shoes and ran out the door to catch the bus.",
  "The river flowed gently through the valley below the mountains.",
  "She hung the painting on the wall above the fireplace.",
  "The baby laughed when the puppy licked her tiny hand.",
  "He saved his money to buy a new bicycle for the summer.",
  "The flowers in the garden bloomed after the spring rain arrived.",
  "She folded the laundry and put it away in the closet neatly.",
  "The airplane flew high above the clouds toward the distant horizon.",
  "He read the newspaper while drinking his morning coffee quietly.",
  "The cat chased a red ball across the living room floor.",
  "She planted tomatoes and basil in the garden this weekend.",
  "The waves crashed against the shore during the evening storm.",
  "He wrote a poem for her birthday and read it aloud.",
  "The library was quiet except for the turning of pages.",
  "She baked chocolate chip cookies for the school bake sale event.",
  "The moon cast a silver glow across the still lake water.",
  "He played guitar by the campfire while everyone sang along.",
  "The squirrel gathered acorns and hid them in the tree hollow.",
  "She painted her bedroom walls a soft shade of blue.",
];

export const MEDIUM: string[] = [
  "The old lighthouse stood on the cliff warning ships of the dangerous rocks below. Its beam swept across the water every fifteen seconds without fail.",
  "Scientists discovered a new species of frog in the dense rainforest of Madagascar. The tiny amphibian measures less than two centimeters in length.",
  "She practiced the piano for three hours every day until her fingers ached. Her dedication paid off when she won the national competition.",
  "The astronaut gazed at the Earth from the space station window. The view of the planet without borders was absolutely breathtaking.",
  "A small bakery opened on the corner of Elm Street last week. Their sourdough bread sells out before noon every single day.",
  "The detective examined the crime scene for any hidden clues. A single footprint near the window led to a major breakthrough.",
  "Volunteers planted over two hundred trees along the riverbank this weekend. The project aims to restore the natural habitat for local wildlife.",
  "The museum displayed ancient artifacts from Egyptian tombs and temples. Visitors waited in line for hours to see the golden mask.",
  "She learned to code when she was twelve years old. Now she builds mobile applications that help people learn new languages.",
  "The thunderstorm rolled across the plains with incredible force. Lightning illuminated the sky while rain poured down in sheets.",
  "The chef prepared a five course meal using ingredients from the local farmers market. Every dish was paired with a carefully selected wine.",
  "He trained for months to run the marathon through the city streets. Crossing the finish line was the most rewarding moment of his life.",
  "The art gallery featured works by emerging artists from around the world. Each piece told a unique story about culture and identity.",
  "She spent the afternoon reading under the shade of a large willow tree. The breeze carried the scent of freshly cut grass across the park.",
  "The old bridge connected the two villages across the wide river. It had stood there for over two hundred years through storms and floods.",
  "The photographer waited for hours to capture the perfect sunset shot. The colors reflected beautifully on the surface of the calm lake.",
  "He built a bookshelf from scratch using oak wood and brass fittings. The project took three weekends to complete but the result was stunning.",
  "The teacher encouraged her students to ask questions and think critically. She believed curiosity was the most important trait a person could have.",
  "The garden produced more tomatoes than they could eat during the summer. They canned the extras and gave jars to all the neighbors.",
  "She learned to speak Japanese fluently after living in Tokyo for two years. The language was difficult at first but practice made it easier every day.",
  "The rescue team worked through the night to find the missing hikers. They finally located them just before dawn tired but safe.",
  "He composed a piece of music inspired by the sound of ocean waves. The melody captured both the power and the tranquility of the sea.",
  "The historian spent decades researching the ancient civilization that once flourished in the desert. New discoveries were made every year.",
  "She started a community garden in an abandoned lot downtown. Now dozens of families grow fresh vegetables and share them with each other.",
  "The engineer designed a bridge that could withstand earthquakes and strong winds. The structure was both functional and beautiful to look at.",
  "He wrote a letter to his future self and sealed it in an envelope. He planned to open it ten years later and see how much had changed.",
  "The wildlife photographer captured images of rare birds in the remote jungle. Some of the species had never been photographed in the wild before.",
  "She organized a beach cleanup that brought together over a hundred volunteers. They collected nearly five hundred pounds of plastic waste in one day.",
  "The astronomer discovered a new comet traveling through the solar system. It would be visible from Earth for the next three weeks.",
  "The carpenter carved intricate patterns into the wooden headboard by hand. Each flower and leaf told a story from the local folklore.",
];

export const LONG: string[] = [
  "The ancient library contained thousands of books spanning multiple centuries and civilizations. Scholars traveled from around the world to study the rare manuscripts and first editions that were housed in its climate controlled vaults. The smell of old paper and leather filled every corridor of the building.",
  "Building a successful startup requires more than just a good idea. You need to understand your target market, build a strong team, secure funding, and execute relentlessly. Many entrepreneurs fail not because of bad ideas but because of poor execution and timing.",
  "The migration of monarch butterflies is one of nature's most remarkable phenomena. Every year millions of these delicate insects travel over three thousand miles from Canada to central Mexico. They navigate using the position of the sun and an internal compass that scientists still do not fully understand.",
  "Urban farming has gained popularity in cities around the world as people seek locally grown food. Rooftops are being transformed into vegetable gardens and abandoned lots into community farms. This movement not only provides fresh produce but also strengthens neighborhood bonds and reduces carbon footprints.",
  "The history of jazz music is deeply rooted in the cultural fabric of New Orleans. From the early twentieth century musicians blended African rhythms with European harmonies to create something entirely new. The genre has since evolved into countless subgenres influencing music across the entire globe.",
  "The invention of the printing press revolutionized how information was shared and preserved. Before Gutenberg books were copied by hand and only the wealthy had access to knowledge. The democratization of information changed the course of human history forever after.",
  "Deep sea exploration has revealed strange and wonderful creatures living in the darkest parts of the ocean. Some fish produce their own light through bioluminescence to attract prey or find mates. The pressure at those depths would crush a human instantly without the protection of a submarine.",
  "The restoration of the ancient cathedral took over twenty years and employed hundreds of skilled craftspeople. Stonemasons carefully carved new gargoyles to replace those worn away by centuries of weather. Stained glass windows were painstakingly reconstructed from thousands of shattered fragments found in storage.",
  "Learning to play a musical instrument has profound effects on brain development in children. Studies show that musicians have improved memory coordination and problem solving skills compared to non musicians. The benefits last well into old age and may help prevent cognitive decline.",
  "The first Moon landing in 1969 was watched by over six hundred million people around the world. Neil Armstrongs famous words about one small step became part of human history forever. The mission was the culmination of years of scientific research and engineering innovation.",
  "Sustainable architecture focuses on reducing the environmental impact of buildings through smart design. Solar panels green roofs and natural ventilation systems help minimize energy consumption. Many modern architects are finding innovative ways to blend sustainability with aesthetic beauty in their projects.",
  "The human brain contains approximately eighty six billion neurons connected by trillions of synapses. Every thought emotion and memory emerges from the complex electrical and chemical signaling between these cells. Scientists are still far from understanding how consciousness arises from this biological network.",
  "The Great Wall of China stretches over thirteen thousand miles across mountains deserts and grasslands. It was built over many centuries by different dynasties to protect against invasions from the north. Contrary to popular belief it cannot be seen from space with the naked eye alone.",
  "Fermentation is one of the oldest food preservation techniques used by humans around the world. From kimchi in Korea to sauerkraut in Germany every culture has its own fermented foods. The process not only preserves food but also creates beneficial probiotics that support digestive health.",
  "The Amazon rainforest produces about twenty percent of the worlds oxygen and is home to millions of species. Deforestation threatens this vital ecosystem through logging agriculture and mining activities. Conservation efforts aim to protect the rainforest while supporting sustainable development for local communities.",
  "The development of vaccines has been one of the most important advances in medical history. Diseases that once killed millions of people have been eradicated or brought under control. The rapid development of COVID vaccines demonstrated how far science has come in understanding immunology.",
  "Ancient Greek philosophers like Socrates Plato and Aristotle laid the foundation for Western philosophy and science. Their ideas about ethics politics and the nature of reality continue to influence modern thought. Many of the questions they asked are still debated by philosophers and scientists today.",
  "The culinary traditions of Italy vary dramatically from region to region based on local ingredients and history. Northern cuisine features butter rice and polenta while the south relies on olive oil pasta and tomatoes. Each region takes pride in its unique dishes passed down through generations of families.",
  "Quantum computing represents a fundamental shift in how we process information at the atomic level. Unlike classical bits which are either zero or one quantum bits can exist in multiple states simultaneously. This allows quantum computers to solve certain problems exponentially faster than traditional computers can manage.",
  "The Silk Road was not a single road but a network of trade routes connecting China to the Mediterranean. Merchants carried silk spices ceramics and ideas across thousands of miles for over fifteen centuries. The exchange of goods and knowledge along these routes shaped the development of civilizations across Eurasia.",
];

export function pickPassage(passages: string[]): string {
  return passages[Math.floor(Math.random() * passages.length)];
}

export function getRank(wpm: number): { label: string; color: string } {
  if (wpm < 25) return { label: "turtle", color: "text-orange-400" };
  if (wpm < 45) return { label: "decent", color: "text-yellow-400" };
  if (wpm < 70) return { label: "fast", color: "text-blue-400" };
  return { label: "godlike", color: "text-purple-400" };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}
