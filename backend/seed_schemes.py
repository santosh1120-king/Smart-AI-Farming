"""
Seed MongoDB with sample Indian government agricultural schemes.
Run: python seed_schemes.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smart_farming")

SCHEMES = [
    {
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "description": "Direct income support of ₹6,000 per year to small and marginal farmers in three equal installments.",
        "benefits": "₹6,000/year directly into bank account in 3 installments of ₹2,000 each",
        "eligibility": "All small and marginal farmers with cultivable landholding. Exclusions apply for government employees, income tax payers.",
        "state": "All",
        "crop_type": "All",
        "apply_link": "https://pmkisan.gov.in/",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "deadline": "Ongoing",
    },
    {
        "name": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "description": "Crop insurance scheme providing financial support to farmers suffering crop loss/damage due to unforeseen events.",
        "benefits": "Insurance coverage for crop losses due to natural calamities, pest attacks, and diseases",
        "eligibility": "All farmers growing notified crops in notified areas. Premium: 2% for Kharif, 1.5% for Rabi, 5% for commercial crops",
        "state": "All",
        "crop_type": "All",
        "apply_link": "https://pmfby.gov.in/",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "deadline": "Kharif & Rabi season deadlines",
    },
    {
        "name": "Kisan Credit Card (KCC)",
        "description": "Provides farmers timely access to credit for their agricultural and allied activities.",
        "benefits": "Credit up to ₹3 lakh at subsidized interest rate of 4%. Revolving credit facility.",
        "eligibility": "All farmers (individual/joint borrowers), tenant farmers, oral leasees, and sharecroppers",
        "state": "All",
        "crop_type": "All",
        "apply_link": "https://www.nabard.org/content1.aspx?id=572",
        "ministry": "Ministry of Finance / NABARD",
        "deadline": "Ongoing",
    },
    {
        "name": "Soil Health Card Scheme",
        "description": "Free soil testing and health cards with crop-wise recommendations on nutrients and fertilizers.",
        "benefits": "Free soil health card with fertilizer recommendations, reducing input costs by up to 10%",
        "eligibility": "All farmers in India",
        "state": "All",
        "crop_type": "All",
        "apply_link": "https://soilhealth.dac.gov.in/",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "deadline": "Ongoing",
    },
    {
        "name": "PM Krishi Sinchayee Yojana (PMKSY)",
        "description": "Ensures irrigation access to every farm and improves water use efficiency. 'Har Khet Ko Pani, More Crop Per Drop'",
        "benefits": "Micro-irrigation subsidy up to 55% for small farmers. Pipeline, drip, and sprinkler systems.",
        "eligibility": "All farmers, especially those in water-stressed areas. Small/marginal farmers get higher subsidy.",
        "state": "All",
        "crop_type": "All",
        "apply_link": "https://pmksy.gov.in/",
        "ministry": "Ministry of Jal Shakti",
        "deadline": "Ongoing",
    },
    {
        "name": "National Horticulture Mission (NHM)",
        "description": "Promotes holistic growth of horticulture sector including fruits, vegetables, root crops, flowers, and medicinal plants.",
        "benefits": "Subsidy for plantation, infrastructure, protected cultivation (polyhouses), and post-harvest management",
        "eligibility": "Horticulture farmers, FPOs, and cooperatives in specified states",
        "state": "All",
        "crop_type": "Vegetables, Fruits, Flowers",
        "apply_link": "https://nhm.nic.in/",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "deadline": "Annual applications",
    },
    {
        "name": "Maharashtra Chief Minister's Agricultural Assistance Scheme",
        "description": "State-specific relief for farmers affected by drought, floods, and unseasonal rainfall in Maharashtra.",
        "benefits": "Up to ₹13,500 per hectare compensation for crop losses",
        "eligibility": "Farmers with crop loss of 33% or more in Maharashtra",
        "state": "Maharashtra",
        "crop_type": "All",
        "apply_link": "https://aaplesarkar.mahaonline.gov.in/",
        "ministry": "Maharashtra State Government",
        "deadline": "Post-disaster applications",
    },
    {
        "name": "Punjab Farmers Welfare Fund",
        "description": "Financial assistance to farmers in Punjab for debt relief and agricultural development.",
        "benefits": "Debt waiver up to ₹2 lakh, tractor subsidy, and cold storage support",
        "eligibility": "Small and marginal farmers registered in Punjab with outstanding loans",
        "state": "Punjab",
        "crop_type": "Wheat, Rice",
        "apply_link": "https://agripb.gov.in/",
        "ministry": "Punjab Agriculture Department",
        "deadline": "Ongoing",
    },
    {
        "name": "Rythu Bandhu Scheme (Telangana)",
        "description": "Investment support scheme providing financial assistance to farmers before cropping season.",
        "benefits": "₹10,000 per acre per season (Kharif + Rabi = ₹20,000/acre/year)",
        "eligibility": "All pattadar farmers (land owners) with agricultural land in Telangana",
        "state": "Telangana",
        "crop_type": "All",
        "apply_link": "https://rythubandhu.telangana.gov.in/",
        "ministry": "Telangana State Government",
        "deadline": "Seasonal",
    },
    {
        "name": "National Food Security Mission (NFSM)",
        "description": "Mission to increase production of rice, wheat, pulses, coarse cereals, and commercial crops.",
        "benefits": "Free demonstration seeds, subsidized farm equipment, training & capacity building",
        "eligibility": "Farmers in identified districts growing rice, wheat, or pulses",
        "state": "All",
        "crop_type": "Rice, Wheat, Pulses",
        "apply_link": "https://nfsm.gov.in/",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "deadline": "Season-wise",
    },
    {
        "name": "Mukhyamantri Kisan Sahay Yojana (Gujarat)",
        "description": "Crop damage compensation for Gujarat farmers affected by natural calamities without premium.",
        "benefits": "Compensation ₹20,000/hectare for 33-60% crop loss; ₹25,000/hectare for >60% loss",
        "eligibility": "Farmers in Gujarat affected by drought, excessive rainfall, or unseasonal rain",
        "state": "Gujarat",
        "crop_type": "All",
        "apply_link": "https://ikhedut.gujarat.gov.in/",
        "ministry": "Gujarat State Government",
        "deadline": "Post-calamity",
    },
    {
        "name": "Rajasthan Krishi Upaj Rahan Rin Yojana",
        "description": "Crop loan scheme against pledge of agricultural produce stored in warehouses.",
        "benefits": "Loan at 0% interest for loans up to ₹1.5 lakh for small farmers",
        "eligibility": "Farmers in Rajasthan with warehouse receipts for stored produce",
        "state": "Rajasthan",
        "crop_type": "All",
        "apply_link": "https://agriculture.rajasthan.gov.in/",
        "ministry": "Rajasthan Agriculture Department",
        "deadline": "Ongoing",
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    schemes_col = db["government_schemes"]

    # Clear existing
    await schemes_col.delete_many({})
    
    # Add timestamps
    for scheme in SCHEMES:
        scheme["created_at"] = datetime.utcnow()
    
    result = await schemes_col.insert_many(SCHEMES)
    print(f"✅ Seeded {len(result.inserted_ids)} government schemes")
    
    # Create indexes
    await db["users"].create_index("email", unique=True)
    await db["crop_analyses"].create_index("user_id")
    await db["crop_analyses"].create_index("created_at")
    await db["notifications"].create_index([("user_id", 1), ("read", 1)])
    await db["voice_logs"].create_index("user_id")
    print("✅ Database indexes created")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
