/**
 * Agent Logic
 * Simple decision tree for the demo.
 */

export class CharityAgent {
    constructor(cronosService, uiController) {
        this.cronos = cronosService;
        this.ui = uiController;
        this.state = "IDLE"; // IDLE, DISCOVERY, CONFIRM_CHARITY, AWAIT_AMOUNT
        this.selectedCharity = null;

        this.categories = ["Environment", "Education", "Animals", "Health", "Arts", "Tech"];
        this.registry = this.generateMockRegistry();
    }

    generateMockRegistry() {
        const brands = [
            // Environment
            { name: "Cronos Green Earth", cat: "Environment", icon: "🌳" },
            { name: "Ocean Cleanup DAO", cat: "Environment", icon: "🌊" },
            { name: "Reforest The Future", cat: "Environment", icon: "🌲" },
            { name: "Solar For All", cat: "Environment", icon: "☀️" },
            { name: "Carbon Zero Initiative", cat: "Environment", icon: "♻️" },
            { name: "Clean Water Protocol", cat: "Environment", icon: "💧" },
            { name: "Save The Amazon", cat: "Environment", icon: "🦜" },
            { name: "Urban Vertical Farms", cat: "Environment", icon: "🏢" },
            { name: "EcoGrid Energy", cat: "Environment", icon: "⚡" },
            { name: "Plastic Free Oceans", cat: "Environment", icon: "🐳" },

            // Education
            { name: "Blockchain For Kids", cat: "Education", icon: "🎓" },
            { name: "Global Literacy Fund", cat: "Education", icon: "📚" },
            { name: "Code The Future", cat: "Education", icon: "💻" },
            { name: "Stem Girls Initiative", cat: "Education", icon: "🧬" },
            { name: "Open Source Academy", cat: "Education", icon: "🏺" },
            { name: "Rural School Connect", cat: "Education", icon: "🏫" },
            { name: "Scholarship DAO", cat: "Education", icon: "📜" },
            { name: "Digital Libraries", cat: "Education", icon: "📖" },
            { name: "Teacher Support Fund", cat: "Education", icon: "🍎" },
            { name: "University Research Grant", cat: "Education", icon: "🧪" },

            // Animals
            { name: "Save The Whales DAO", cat: "Animals", icon: "🐋" },
            { name: "Tiger Conservation", cat: "Animals", icon: "🐯" },
            { name: "Stray Dog Rescue", cat: "Animals", icon: "🐕" },
            { name: "Wild Bird Sanctuary", cat: "Animals", icon: "🦅" },
            { name: "Panda Protection", cat: "Animals", icon: "🐼" },
            { name: "Koala Habitat Resto", cat: "Animals", icon: "🐨" },
            { name: "Marine Life Guard", cat: "Animals", icon: "🐠" },
            { name: "Elephant Sanctuary", cat: "Animals", icon: "🐘" },
            { name: "Bee Population Revive", cat: "Animals", icon: "🐝" },
            { name: "Animal Shelter Alpha", cat: "Animals", icon: "🏠" },

            // Health
            { name: "MediChain Relief", cat: "Health", icon: "🚑" },
            { name: "Cancer Research DAO", cat: "Health", icon: "🔬" },
            { name: "Mental Health Aware", cat: "Health", icon: "🧠" },
            { name: "Global Vaccine Fund", cat: "Health", icon: "💉" },
            { name: "Heart Care Foundation", cat: "Health", icon: "❤️" },
            { name: "Red Cross On-Chain", cat: "Health", icon: "🏥" },
            { name: "Vision For All", cat: "Health", icon: "👓" },
            { name: "Diabetes Support", cat: "Health", icon: "🩺" },
            { name: "Elderly Care Connect", cat: "Health", icon: "👵" },
            { name: "Emergency Response", cat: "Health", icon: "🚨" },

            // Arts & Tech
            { name: "Digital Artists Fund", cat: "Arts", icon: "🎨" },
            { name: "Museum On-Chain", cat: "Arts", icon: "🏛️" },
            { name: "Music For Peace", cat: "Arts", icon: "🎵" },
            { name: "Web3 Developer Grant", cat: "Tech", icon: "⌨️" },
            { name: "Privacy Tooling Fund", cat: "Tech", icon: "🔒" },
            { name: "AI Safety Research", cat: "Tech", icon: "🤖" },
            { name: "DeSci Lab Equipment", cat: "Tech", icon: "🔭" },
            { name: "Internet For All", cat: "Tech", icon: "📡" },
            { name: "Civic Tech Alliance", cat: "Tech", icon: "🏙️" },
            { name: "Open Data Protocol", cat: "Tech", icon: "💾" }
        ];

        return brands.map((b, i) => ({
            id: `${b.name.toLowerCase().replace(/\s+/g, '')}.cro`,
            name: b.name,
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Using same demo address for all
            category: b.cat,
            description: `Verified impact project focused on ${b.cat.toLowerCase()} initiatives.`,
            bio: `**${b.name}** has been verified by Cronos ID since 2024. \n\nThey specialize in **${b.cat}** solutions, leveraging blockchain technology to ensure 100% transparency in fund allocation. \n\nRecent milestones:\n• 50+ Successful on-chain campaigns\n• 1M+ CRO deployed to impact causes\n• Top-rated by the decentralized communityDAO.\n\nYour donation will directly fund their upcoming Q3 initiative.`,
            icon: b.icon
        }));
    }

    async processMessage(userText) {
        const text = userText.toLowerCase();

        // 0. Global "Urgent" or "Emergency" Detection
        if (text.includes("urgent") || text.includes("emergency") || text.includes("disaster")) {
            this.state = "DISCOVERY"; // Force discovery
            // Filter for Health/Emergency immediately
            const emergencyCharities = this.registry.filter(c => c.category === "Health");
            // Pick the first one for now or show list
            const recommended = emergencyCharities[0];
            this.selectedCharity = recommended;
            this.state = "CONFIRM_CHARITY";
            return {
                text: `🚨 **Emergency Response Mode Activated** 🚨\n\nI've detected an urgent request. recommending **${recommended.name}** for immediate medical/disaster relief.\n\nVerified ID: ${recommended.id}. \n\nProceed with donation?`,
                action: "SHOW_DETAILS",
                payload: recommended
            };
        }

        // 1. Initial Greeting / Reset
        if (text.includes("hello") || text.includes("start") || text.includes("reset")) {
            this.state = "DISCOVERY";
            this.selectedCharity = null;
            return {
                text: "Hello! I am your Verifiable Charity Agent. \n\n**Scenarios available:**\n1. Tell me a cause (e.g. 'Environment')\n2. Mention 'Urgent' for emergency response\n3. Browse the list manually\n\nHow can I help?",
                action: null
            };
        }

        // 2. Discovery Phase
        if (this.state === "IDLE" || this.state === "DISCOVERY") {
            // Check for specific budget constraints in the query (e.g. "I have a small budget")
            if (text.includes("small") || text.includes("tiny") || text.includes("little")) {
                return {
                    text: "Micro-donations are the backbone of decentralized funding! 💧 \n\nPlease select a cause, and I'll generate a gas-optimized transaction for you. (Try 'Education' or 'Arts')",
                    action: null
                };
            }

            // Check if text matches a category or name
            let found = this.registry.find(c =>
                text.includes(c.name.toLowerCase()) ||
                text.includes(c.category.toLowerCase()) ||
                text.includes(c.id)
            );

            if (found) {
                this.selectedCharity = found;
                this.state = "CONFIRM_CHARITY";
                return {
                    text: `I found a match: **${found.name}** ${found.icon}.\n\n*${found.description}*\n\nVerified ID: ${found.id}. Would you like to support them?`,
                    action: "SHOW_DETAILS",
                    payload: found
                };
            }

            if (this.state === "DISCOVERY") {
                return {
                    text: "I couldn't find a specific match. You can browse the list on the right, or tell me if this is an 'Urgent' situation.",
                    action: null
                };
            }
        }

        // 3. Confirmation Phase
        if (this.state === "CONFIRM_CHARITY") {
            if (text.includes("yes") || text.includes("sure") || text.includes("ok") || text.includes("confirm")) {
                this.state = "AWAIT_AMOUNT";
                return {
                    text: `Great. How much CRO would you like to donate to **${this.selectedCharity.name}**?`,
                    action: null
                };
            } else if (text.includes("more") || text.includes("tell") || text.includes("details") || text.includes("what") || text.includes("who")) {
                // Extended Bio Flow
                return {
                    text: `📖 **About ${this.selectedCharity.name}**\n\n${this.selectedCharity.bio}\n\nReady to donate?`,
                    action: null
                };
            } else if (text.includes("no") || text.includes("cancel")) {
                this.state = "DISCOVERY";
                this.selectedCharity = null;
                return {
                    text: "Understood. Let's start over. What cause are you interested in?",
                    action: null
                };
            }
        }

        // 4. Amount / Payment Phase
        if (this.state === "AWAIT_AMOUNT") {
            // Extract number
            const match = text.match(/[\d\.]+/);
            if (match) {
                const amount = parseFloat(match[0]);

                // Budget Logic / Scenarios
                if (amount >= 500) {
                    // High Value Scenario
                    this.state = "IDLE"; // Reset after generating card
                    return {
                        text: `🌟 **High Impact Donor Detected** 🌟\n\nFor a donation of ${amount} CRO, you qualify for a **Titanium Tier Impact NFT** receipt.\n\nPreparing your VIP payment card...`,
                        action: "SHOW_PAYMENT_CARD",
                        payload: {
                            charity: this.selectedCharity,
                            amount: amount,
                            tier: "VIP" // Logic handled in UI to maybe show gold border
                        }
                    };
                } else if (amount < 5) {
                    // Micro Donation Scenario
                    this.state = "IDLE";
                    return {
                        text: `Thanks for your micro-donation! 💧\n\nEvery CRO counts. Here is your express payment link:`,
                        action: "SHOW_PAYMENT_CARD",
                        payload: {
                            charity: this.selectedCharity,
                            amount: amount,
                            tier: "MICRO"
                        }
                    };
                } else {
                    // Standard Scenario
                    this.state = "IDLE";
                    return {
                        text: `Generating x402 Payment Request for **${amount} CRO**...`,
                        action: "SHOW_PAYMENT_CARD",
                        payload: {
                            charity: this.selectedCharity,
                            amount: amount,
                            tier: "STANDARD"
                        }
                    };
                }
            } else {
                return {
                    text: "I couldn't understand the amount. Please enter a number (e.g. 50).",
                    action: null
                };
            }
        }

        return {
            text: "I didn't quite catch that. Try saying 'Hello' to restart.",
            action: null
        };
    }
}
