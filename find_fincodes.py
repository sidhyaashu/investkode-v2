import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    url = "postgresql+asyncpg://InvestKode:Xpolog%4000%26@finglobalai-data-dum.postgres.database.azure.com:5432/financial_db?ssl=require"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT fincode, price, mcap FROM public.company_equity WHERE price IS NOT NULL LIMIT 5"))
        for row in res:
            print(row)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
