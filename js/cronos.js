/**
 * Cronos Service
 * Handles interaction with the Cronos blockchain via Ethers.js
 */

export class CronosService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.chainId = null;

        // Target Charity Address (Demo Address)
        this.charityAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    }

    async connectWallet() {
        // Check if Ethers.js is loaded
        if (typeof ethers === 'undefined') {
            console.error("Ethers.js library not loaded");
            throw new Error("System Error: Ethers.js library missing. Please check your internet connection.");
        }

        if (!window.ethereum) {
            console.error("Window.ethereum not found");
            throw new Error("No crypto wallet found. Please install Metamask or DeFi Wallet extension.");
        }

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);

            // Request account access
            const accounts = await this.provider.send("eth_requestAccounts", []);
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts returned. Please unlock your wallet.");
            }

            this.signer = await this.provider.getSigner();
            this.userAddress = accounts[0];

            // Get Chain ID to ensure we are on Cronos
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            console.log("Connected to chain:", this.chainId);

            // Optional: Switch to Cronos Mainnet if not connected
            // ChainId 25 is Cronos Mainnet

            return this.userAddress;
        } catch (error) {
            console.error("Wallet connection failed details:", error);
            // Improve error message for user
            if (error.code === 4001) {
                throw new Error("You rejected the connection request.");
            }
            throw new Error(error.message || "Unknown connection error");
        }
    }

    formatAddress(address) {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    async sendDonation(destinationAddress, amountCRO) {
        if (!this.signer) throw new Error("Wallet not connected");

        try {
            // Parse amount to Wei
            const amountWei = ethers.parseEther(amountCRO.toString());

            // Create Transaction
            const tx = await this.signer.sendTransaction({
                to: destinationAddress,
                value: amountWei
            });

            return tx; // Returns transaction response
        } catch (error) {
            console.error("Transaction failed:", error);
            throw error;
        }
    }

    async verifyTransaction(txHash) {
        if (!this.provider) return null;

        try {
            // Wait for 1 confirmation
            const receipt = await this.provider.waitForTransaction(txHash, 1);
            return receipt;
        } catch (error) {
            console.error("Verification failed:", error);
            throw error;
        }
    }

    // Mock Cronos ID resolution for demo (Client-side only)
    async resolveCronosId(address) {
        // In a real app, we would query the CNS contract here.
        // For this demo, we'll return a mock name if it matches our charity address
        if (address.toLowerCase() === this.charityAddress.toLowerCase()) {
            return "CronosCharity.cro";
        }
        return null;
    }
}
