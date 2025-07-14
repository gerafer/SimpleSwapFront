const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
    let SimpleSwap; // Acá voy a tener todos los datos del contrato nec. para poder deployaelo
    let simpleSwap; // Acá voy a tener el contrato deployado

    let tokenA, tokenB, Token;

    let owner, user1, addr1, user2;

    const addrTokenA = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const addrTokenB = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const addrSimpleSwap = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    // beforeEach se ejecuta antes de cada it
    // before se ejecuta una sola vez y luego corre todos los it
    before(async function () {
        [owner, user1, addr1, user2] = await ethers.getSigners();

        Token = await ethers.getContractFactory("MiToken");

        tokenA = await Token.deploy("TokenA", "TKA");
        await tokenA.waitForDeployment();

        tokenB = await Token.deploy("TokenB", "TKB");
        await tokenB.waitForDeployment();

        SimpleSwap = await ethers.getContractFactory("SimpleSwap");
        simpleSwap = await SimpleSwap.deploy(await tokenA.getAddress(), await tokenB.getAddress());

        await simpleSwap.waitForDeployment();

        // Mint tokens to addr1
        await tokenA.mint(addr1.address, ethers.parseEther("1000"));
        await tokenB.mint(addr1.address, ethers.parseEther("1000"));

        // Approve transferFrom to the contract
        await tokenA.connect(addr1).approve(
            await simpleSwap.getAddress(),
            ethers.parseEther("1000")
        );
        await tokenB.connect(addr1).approve(
            await simpleSwap.getAddress(),
            ethers.parseEther("1000")
        );

        // Mint tokens to user2 for swap
        await tokenA.mint(user2.address, ethers.parseUnits("10", 18));
        await tokenB.mint(user2.address, ethers.parseUnits("10", 18));

    });

    it("testing gettotalLiquidity()", async function () {
        let result = await simpleSwap.totalLiquidity();
        expect(result).to.equal("0");
    });

    it("testing getreserveA()", async function () {
        let result = await simpleSwap.reserveA();
        expect(result).to.equal("0");
    });

    it("testing getreserveB()", async function () {
        let result = await simpleSwap.reserveB();
        expect(result).to.equal("0");
    });

    it("testing mint()", async function () {
        const mintAmount = 100;
        await tokenA.connect(owner).mint(user1.address, mintAmount);
        let result = await tokenA.balanceOf(user1.address);
        expect(result).to.equal(ethers.parseUnits("100", 18));
    });

    it("testing addLiquidity()", async () => {

        const amountA = ethers.parseUnits("100", 18);
        const amountB = ethers.parseUnits("200", 18);
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        const tx = await simpleSwap
            .connect(addr1)
            .addLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                amountA,
                amountB,
                amountA,
                amountB,
                addr1.address,
                deadline
            );


        const receipt = await tx.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return simpleSwap.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "LiquidityAdded");

        expect(event).to.not.be.undefined;

        const liquidityMinted = event.args.liquidityMinted;

        const expectedLiquidity = sqrtSolidityStyle(amountA * amountB);
        expect(liquidityMinted).to.equal(expectedLiquidity);

        const reservesA = await simpleSwap.reserveA();
        const reservesB = await simpleSwap.reserveB();
        const liquidity = await simpleSwap.totalLiquidity();
        const balance = await simpleSwap.liquidityBalance(addr1.address);

        expect(reservesA).to.equal(amountA);
        expect(reservesB).to.equal(amountB);
        expect(liquidity).to.equal(balance);
        expect(liquidity).to.be.gt(0n);
    });

    it("should emit LiquidityAdded event with correct values", async () => {
        const amountA = ethers.parseUnits("100", 18);
        const amountB = ethers.parseUnits("200", 18);
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        const tx = await simpleSwap
            .connect(addr1)
            .addLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                amountA,
                amountB,
                amountA,
                amountB,
                addr1.address,
                deadline
            );

        const receipt = await tx.wait();

        const event = receipt.logs
            .map(log => {
                try {
                    return simpleSwap.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "LiquidityAdded");

        expect(event).to.not.be.undefined;

        expect(event.args.provider).to.equal(addr1.address);
        expect(event.args.amountA).to.equal(amountA);
        expect(event.args.amountB).to.equal(amountB);

        // Para liquidityMinted, calculamos el esperado igual que en el contrato:
        const expectedLiquidity = sqrtSolidityStyle(amountA * amountB);
        expect(event.args.liquidityMinted).to.equal(expectedLiquidity);
    });

    it("testing getPrice()", async () => {
        const price = await simpleSwap.getPrice(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

        // price es un número con 18 decimales
        expect(price).to.equal(ethers.parseUnits("2", 18));
    });

    it("testing getAmountOut()", async () => {
        const amountIn = ethers.parseUnits("1", 18);

        const amountOut = await simpleSwap.getAmountOut(
            amountIn,
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

        // amountOut debe ser > 0 y menor a 3 ethers (un valor alto para cubrir la salida)
        expect(amountOut).to.be.gt(0);
        expect(amountOut).to.be.lt(ethers.parseUnits("3", 18));
    });


    it("should revert if deadline is in the past", async () => {
        const pastDeadline = (await ethers.provider.getBlock("latest")).timestamp - 10;

        await expect(
            simpleSwap.connect(user1).addLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                ethers.parseUnits("1", 18),
                ethers.parseUnits("1", 18),
                0,
                0,
                user1.address,
                pastDeadline
            )
        ).to.be.revertedWith("Transaction expired");
    });


    it("should revert on getPrice with invalid token pair", async () => {
        const FakeToken = await ethers.getContractFactory("MiToken");
        const fake = await FakeToken.deploy("Fake", "FAK");
        await fake.waitForDeployment();

        await expect(
            simpleSwap.getPrice(await fake.getAddress(), await tokenB.getAddress())
        ).to.be.revertedWith("Invalid tokens");
    });

    it("testing swapExactTokensForTokens() TokenA for TokenB", async function () {
        const amountIn = ethers.parseUnits("1", 18);
        const path = [await tokenA.getAddress(), await tokenB.getAddress()];
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        // User approves SimpleSwap
        await tokenA.connect(user2).approve(simpleSwap, amountIn);

        const balanceBefore = await tokenB.balanceOf(user2.address);

        const tx = await simpleSwap.connect(user2).swapExactTokensForTokens(
            amountIn,
            0, // amountOutMin
            path,
            user2.address,
            deadline
        );

        const receipt = await tx.wait();
        const balanceAfter = await tokenB.balanceOf(user2.address);

        const amountOut = balanceAfter - balanceBefore;

        expect(amountOut).to.be.gt(0);
        expect(balanceAfter).to.be.gt(balanceBefore);

        const event = receipt.logs
            .map(log => {
                try {
                    return simpleSwap.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "TokensSwapped" && e.args.swapper === user2.address);

        expect(event).to.not.be.undefined;

        expect(event.args.amountIn).to.equal(amountIn);
        expect(event.args.tokenIn).to.equal(await tokenA.getAddress());
        expect(event.args.tokenOut).to.equal(await tokenB.getAddress());
    });

    it("should emit TokensSwapped event with correct values", async () => {
        // Volvemos a agregar liquidez primero para que haya suficiente para el swap
        const amountA = ethers.parseUnits("100", 18);
        const amountB = ethers.parseUnits("200", 18);
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        await tokenA.connect(addr1).approve(simpleSwap, amountA);
        await tokenB.connect(addr1).approve(simpleSwap, amountB);

        await simpleSwap.connect(addr1).addLiquidity(
            await tokenA.getAddress(),
            await tokenB.getAddress(),
            amountA,
            amountB,
            0,
            0,
            addr1.address,
            deadline
        );

        // Preparamos el swap
        const amountIn = ethers.parseUnits("1", 18);
        const path = [await tokenA.getAddress(), await tokenB.getAddress()];

        await tokenA.connect(user2).approve(simpleSwap, amountIn);

        const tx = await simpleSwap.connect(user2).swapExactTokensForTokens(
            amountIn,
            0,
            path,
            user2.address,
            deadline
        );

        const receipt = await tx.wait();

        const event = receipt.logs
            .map(log => {
                try {
                    return simpleSwap.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "TokensSwapped");

        expect(event).to.not.be.undefined;

        expect(event.args.swapper).to.equal(user2.address);
        expect(event.args.amountIn).to.equal(amountIn);
        expect(event.args.tokenIn).to.equal(await tokenA.getAddress());
        expect(event.args.tokenOut).to.equal(await tokenB.getAddress());

        // amountOut debe ser mayor a 0
        expect(event.args.amountOut).to.be.gt(0n);
    });

    it("should revert if amountOut < amountOutMin", async () => {
        const amountIn = ethers.parseUnits("1", 18);
        const path = [await tokenA.getAddress(), await tokenB.getAddress()];
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        await tokenA.connect(user2).approve(simpleSwap, amountIn);

        // Simular una cantidad mínima inalcanzable para forzar el revert
        const amountOutMin = ethers.parseUnits("1000", 18); // muy alta

        await expect(
            simpleSwap.connect(user2).swapExactTokensForTokens(
                amountIn,
                amountOutMin, // <--- esta línea dispara el require
                path,
                user2.address,
                deadline
            )
        ).to.be.revertedWith("Insufficient output amount");
    });


    it("should revert if path length is not 2", async () => {
        await expect(
            simpleSwap.connect(user2).swapExactTokensForTokens(
                ethers.parseUnits("1", 18),
                0,
                [await tokenA.getAddress()], // invalid path
                user2.address,
                (await ethers.provider.getBlock("latest")).timestamp + 60
            )
        ).to.be.revertedWith("Path length must be 2");
    });


    it("should revert if input token is invalid", async () => {
        const FakeToken = await ethers.getContractFactory("MiToken");
        const fake = await FakeToken.deploy("Fake", "FAK");
        await fake.waitForDeployment();

        await fake.mint(user2.address, ethers.parseUnits("10", 18));
        await fake.connect(user2).approve(simpleSwap, ethers.parseUnits("10", 18));

        await expect(
            simpleSwap.connect(user2).swapExactTokensForTokens(
                ethers.parseUnits("1", 18),
                0,
                [await fake.getAddress(), await tokenB.getAddress()],
                user2.address,
                (await ethers.provider.getBlock("latest")).timestamp + 60
            )
        ).to.be.revertedWith("Invalid input token");
    });







    it("testing removeLiquidity()", async () => {

        const amountAmin = ethers.parseUnits("40", 18);
        const amountBmin = ethers.parseUnits("80", 18);
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        const balanceBefore = await simpleSwap.liquidityBalance(addr1.address);
        const balanceABefore = await tokenA.balanceOf(addr1.address);
        const balanceBBefore = await tokenB.balanceOf(addr1.address);

        const reservesABefore = await simpleSwap.reserveA();
        const reservesBBefore = await simpleSwap.reserveB();


        const tx = await simpleSwap
            .connect(addr1)
            .removeLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                balanceBefore,
                amountAmin,
                amountBmin,
                addr1.address,
                deadline
            );

        const receipt = await tx.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return simpleSwap.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "LiquidityRemoved");

        expect(event).to.not.be.undefined;

        expect(event.args.amountA).to.be.gt(amountAmin);
        expect(event.args.amountB).to.be.gt(amountBmin);

        const balanceAfter = await simpleSwap.liquidityBalance(addr1.address);
        const balanceDiff = balanceBefore - balanceAfter;
        expect(balanceDiff).to.be.gt(0n);

        const balanceAAfter = await tokenA.balanceOf(addr1.address);
        const balanceADiff = balanceAAfter - balanceABefore;
        expect(balanceADiff).to.be.gt(0n);

        const balanceBAfter = await tokenB.balanceOf(addr1.address);
        const balanceBDiff = balanceBAfter - balanceBBefore;
        expect(balanceBDiff).to.be.gt(0n);

        const reservesAAfter = await simpleSwap.reserveA();
        const reservesADifff = reservesABefore - reservesAAfter;
        expect(reservesADifff).to.be.gt(0n);

        const reservesBAfter = await simpleSwap.reserveB();
        const reservesBDifff = reservesBBefore - reservesBAfter;
        expect(reservesBDifff).to.be.gt(0n);

    });

    it("should revert if 'Insufficient liquidity' ", async () => {
        const amountIn = ethers.parseUnits("1", 18);
        const path = [await tokenA.getAddress(), await tokenB.getAddress()];
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;

        await tokenA.connect(user2).approve(simpleSwap, amountIn);

        const amountOutMin = ethers.parseUnits("1000", 18);

        // Ya se removió la liquidez por eso va a revertir
        await expect(
            simpleSwap.connect(user2).swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                user2.address,
                deadline
            )
        ).to.be.revertedWith("Insufficient liquidity");
    });





});

function sqrtSolidityStyle(x) {
    if (x === 0n) return 0n;
    let z = (x + 1n) / 2n;
    let y = x;

    for (let i = 0; i < 7; ++i) {
        y = z;
        z = (y + x / y) / 2n;
    }

    if (y * y > x) y -= 1n;

    return y;
}



