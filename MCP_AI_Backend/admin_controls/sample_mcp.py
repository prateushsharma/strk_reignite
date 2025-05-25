from library import tool

@tool(
    name="calculate_sum",
    description="Calculates the sum of two numbers",
    parameters=[
        ("a", int, True),
        ("b", int, False)
    ],
    returns=[int]
)
async def calculate_sum(a, b=0):
    """Original function docstring"""
    return a + b

@tool(
    name="greet_user",
    description="Greets a user by name",
    parameters=[
        ("name", str, True)
    ],
    returns=[str]
)
async def greet_user(name):
    return f"Hello, {name}!"

# This would be your main code that uses the tools
if __name__ == "__main__":
    import asyncio
    
    async def main():
        print(await calculate_sum(5, 3))
        print(await greet_user("Alice"))
    
    asyncio.run(main())