// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ERC-20 Interface
/// /// @notice Standard ERC-20 token interface for interaction
interface IERC20 {
    /// @notice Returns the total number of tokens in existence
    function totalSupply() external view returns (uint256);

    /// @notice Returns the number of tokens owned by `account`
    function balanceOf(address account) external view returns (uint256);

    /// @notice Transfers `amount` tokens to `recipient`
    /// @param recipient The address to transfer tokens to
    /// @param amount The amount of tokens to transfer
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    /// @notice Returns the remaining number of tokens that `spender` can spend on behalf of `owner`
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /// @notice Sets `amount` as the allowance of `spender` over the caller’s tokens
    /// @param spender The address that will spend the tokens
    /// @param amount The number of tokens allowed
    function approve(address spender, uint256 amount) external returns (bool);

    /// @notice Transfers `amount` tokens from `sender` to `recipient` using the allowance mechanism
    /// @param sender The address from which tokens are transferred
    /// @param recipient The address to which tokens are transferred
    /// @param amount The number of tokens to transfer
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /// @notice Emitted when `value` tokens are moved from one account (`from`) to another (`to`)
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Emitted when the allowance of a `spender` for an `owner` is set by a call to `approve`
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

///// @title SimpleSwap - Minimal Uniswap-style AMM without fees for a token pair
/// @author Gerardo Fernandez
/// @notice Enables liquidity provision, token swaps, price queries and output calculations
/// @dev Operates with one ERC20 pair, managing liquidity internally without fees
contract SimpleSwap {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public totalLiquidity = 0;
    uint256 public reserveA = 0;
    uint256 public reserveB = 0;

    mapping(address => uint256) public liquidityBalance;

    /// @notice Emitted when liquidity is added
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityMinted
    );

    /// @notice Emitted when tokens are swapped
    event TokensSwapped(
        address indexed swapper,
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut
    );

    /// @notice Emitted when liquidity is removed
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityBurned
    );

    /// @notice Initializes the SimpleSwap contract with two ERC20 token addresses
    /// @param _tokenA Address of tokenA
    /// @param _tokenB Address of tokenB
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != _tokenB, "Identical token addresses");
        require(
            _tokenA != address(0) && _tokenB != address(0),
            "Zero address tokens"
        );
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /// @notice Ensures the token pair matches the initialized tokenA/tokenB
    /// @param _tokenA The address of the first token
    /// @param _tokenB The address of the second token
    modifier validTokenPair(address _tokenA, address _tokenB) {
        require(
            _tokenA == address(tokenA) && _tokenB == address(tokenB),
            "Invalid tokens"
        );
        _;
    }

    /// @notice Ensures that the transaction has not expired
    /// @param deadline Timestamp after which the transaction is invalid
    modifier notExpired(uint256 deadline) {
        require(block.timestamp <= deadline, "Transaction expired");
        _;
    }

    /// @notice Ensures the recipient address is not the zero address
    /// @param to The address that will receive tokens
    modifier validRecipient(address to) {
        require(to != address(0), "Invalid recipient");
        _;
    }

    /// @notice Adds liquidity to the token pair pool
    /// @dev Mints LP tokens based on reserves or initial liquidity formula
    /// @param addTokenA Address of token A
    /// @param addTokenB Address of token B
    /// @param amountADesired Desired amount of token A to add
    /// @param amountBDesired Desired amount of token B to add
    /// @param amountAMin Minimum amount of token A to add (slippage protection)
    /// @param amountBMin Minimum amount of token B to add (slippage protection)
    /// @param to Address that will receive the minted LP tokens
    /// @param deadline Expiration timestamp for this transaction
    /// @return amountA Actual amount of token A added
    /// @return amountB Actual amount of token B added
    /// @return liquidity Amount of liquidity tokens minted
    function addLiquidity(
        address addTokenA,
        address addTokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        validTokenPair(addTokenA, addTokenB)
        notExpired(deadline)
        validRecipient(to)
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        (amountA, amountB) = _calculateOptimalAmounts(
            amountADesired,
            amountBDesired
        );

        require(amountA >= amountAMin, "amountA < amountAMin");
        require(amountB >= amountBMin, "amountB < amountBMin");

        liquidity = _calculateLiquidityToMint(amountA, amountB);
        require(liquidity > 0, "Insufficient liquidity minted");

        _performTransfersAndStateUpdate(amountA, amountB, liquidity, to);

        emit LiquidityAdded(to, amountA, amountB, liquidity);
    }

    /// @notice Calculates optimal amounts of tokens to add based on existing reserves
    /// @param amountADesired Desired amount of token A
    /// @param amountBDesired Desired amount of token B
    /// @return amountA Optimal amount of token A to add
    /// @return amountB Optimal amount of token B to add
    function _calculateOptimalAmounts(
        uint256 amountADesired,
        uint256 amountBDesired
    ) internal view returns (uint256 amountA, uint256 amountB) {
        if (totalLiquidity == 0) {
            return (amountADesired, amountBDesired);
        }

        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;

        uint256 amountBOptimal = (amountADesired * _reserveB) / _reserveA;
        if (amountBOptimal <= amountBDesired) {
            return (amountADesired, amountBOptimal);
        } else {
            uint256 amountAOptimal = (amountBDesired * _reserveA) / _reserveB;
            require(amountAOptimal <= amountADesired, "Insufficient A amount");
            return (amountAOptimal, amountBDesired);
        }
    }

    /// @notice Calculates the amount of liquidity tokens to mint
    /// @dev Uses geometric mean for initial liquidity, or proportional share otherwise
    /// @param amountA Amount of token A provided
    /// @param amountB Amount of token B provided
    /// @return liquidity Amount of LP tokens to mint
    function _calculateLiquidityToMint(uint256 amountA, uint256 amountB)
        internal
        view
        returns (uint256 liquidity)
    {
        if (totalLiquidity == 0) {
            return sqrt(amountA * amountB);
        }

        uint256 liquidityA = (amountA * totalLiquidity) / reserveA;
        uint256 liquidityB = (amountB * totalLiquidity) / reserveB;
        return liquidityA < liquidityB ? liquidityA : liquidityB;
    }

    /// @dev Transfers tokens from user and updates reserves and liquidity balances
    /// @param amountA Amount of token A to transfer
    /// @param amountB Amount of token B to transfer
    /// @param liquidity Liquidity tokens to mint
    /// @param to Address to receive liquidity tokens
    function _performTransfersAndStateUpdate(
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        address to
    ) internal {
        require(
            tokenA.transferFrom(msg.sender, address(this), amountA),
            "Transfer tokenA failed"
        );
        require(
            tokenB.transferFrom(msg.sender, address(this), amountB),
            "Transfer tokenB failed"
        );

        reserveA += amountA;
        reserveB += amountB;
        liquidityBalance[to] += liquidity;
        totalLiquidity += liquidity;
    }

    /// @notice Returns the current price of tokenA in terms of tokenB
    /// @dev Assumes the pair is tokenA/tokenB; result is scaled by 1e18
    /// @param _tokenA Address of token A
    /// @param _tokenB Address of token B
    /// @return price The current price (reserveB / reserveA) scaled by 1e18
    function getPrice(address _tokenA, address _tokenB)
        external
        view
        validTokenPair(_tokenA, _tokenB)
        returns (uint256 price)
    {
        // Calculate price as tokenB per tokenA using pool reserves
        // Multiply by 1e18 to maintain fixed-point precision
        return (reserveB * 1e18) / reserveA;
    }

    /// @notice Calculates the amount of output tokens for a given input
    /// @dev Uses constant product formula without fees
    /// @param amountIn Input token amount
    /// @param amountA Reserve of input token
    /// @param amountB Reserve of output token
    /// @return amountOut Calculated output amount
    function getAmountOut(
        uint256 amountIn,
        uint256 amountA,
        uint256 amountB
    ) public pure returns (uint256 amountOut) {
        // Input must be greater than zero
        require(amountIn > 0, "Insufficient input amount");

        // Liquidity reserves must be greater than zero
        require(amountA > 0 && amountB > 0, "Insufficient liquidity");

        // Calculate output using the constant product formula (x * y = k)
        // Formula without fee
        amountOut = (amountIn * amountB) / (amountA + amountIn);

        return amountOut;
    }

    /// @notice Swaps an exact amount of input tokens for as many output tokens as possible
    /// @dev Supports only one path hop (tokenA <-> tokenB)
    /// @param amountIn Exact amount of input tokens to swap
    /// @param amountOutMin Minimum acceptable output tokens (slippage protection)
    /// @param path Array with 2 token addresses: [inputToken, outputToken]
    /// @param to Address to receive output tokens
    /// @param deadline Expiration timestamp for this swap
    /// @return amounts Array with input and output amounts: [amountIn, amountOut]
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        notExpired(deadline)
        validRecipient(to)
        returns (uint256[] memory amounts)
    {
        require(path.length == 2, "Path length must be 2");

        address inputToken = path[0];
        address outputToken = path[1];

        _validateInputToken(inputToken);
        _transferInputTokens(inputToken, amountIn);

        uint256 amountOut = _computeAndExecuteSwap(
            inputToken,
            outputToken,
            amountIn,
            amountOutMin,
            to
        );

        amounts = _buildSwapAmounts(amountIn, amountOut);

        emit TokensSwapped(
            msg.sender,
            amountIn,
            amountOut,
            inputToken,
            outputToken
        );
        return amounts;
    }

    function _validateInputToken(address inputToken) internal view {
        require(
            inputToken == address(tokenA) || inputToken == address(tokenB),
            "Invalid input token"
        );
    }

    function _transferInputTokens(address inputToken, uint256 amountIn)
        internal
    {
        require(
            IERC20(inputToken).transferFrom(
                msg.sender,
                address(this),
                amountIn
            ),
            "TransferFrom failed"
        );
    }

    /// @dev Returns current reserves based on input token
    /// @param inputToken Address of the input token
    /// @return reserveInput Reserve of input token
    /// @return reserveOutput Reserve of output token
    function _getReserves(address inputToken)
        internal
        view
        returns (uint256, uint256)
    {
        if (inputToken == address(tokenA)) {
            return (reserveA, reserveB);
        } else {
            return (reserveB, reserveA);
        }
    }

    /// @dev Updates reserves after a swap
    /// @param inputToken Token address used for input
    /// @param amountIn Amount of input token added
    /// @param amountOut Amount of output token removed
    function _updateReserves(
        address inputToken,
        uint256 amountIn,
        uint256 amountOut
    ) internal {
        if (inputToken == address(tokenA)) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
    }

    /// @dev Computes output and executes token transfer for swap
    /// @param inputToken Input token address
    /// @param outputToken Output token address
    /// @param amountIn Amount of input token provided
    /// @param amountOutMin Minimum acceptable output tokens
    /// @param to Address to receive output tokens
    /// @return amountOut Output token amount sent to `to`
    function _computeAndExecuteSwap(
        address inputToken,
        address outputToken,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) internal returns (uint256 amountOut) {
        (uint256 reserveInput, uint256 reserveOutput) = _getReserves(
            inputToken
        );

        require(amountIn > 0, "Insufficient input amount");
        require(
            reserveInput > 0 && reserveOutput > 0,
            "Insufficient liquidity"
        );

        amountOut = getAmountOut(amountIn, reserveInput, reserveOutput);
        require(amountOut >= amountOutMin, "Insufficient output amount");

        _updateReserves(inputToken, amountIn, amountOut);
        require(
            IERC20(outputToken).transfer(to, amountOut),
            "Transfer out failed"
        );
    }

    /// @dev Creates array with input and output amounts for return
    /// @param amountIn Input token amount
    /// @param amountOut Output token amount
    /// @return amounts Array: [amountIn, amountOut]
    function _buildSwapAmounts(uint256 amountIn, uint256 amountOut)
        internal
        pure
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }

    /// @notice Burns liquidity tokens and withdraws corresponding token amounts
    /// @param addTokenA Address of token A
    /// @param addTokenB Address of token B
    /// @param liquidity Amount of LP tokens to burn
    /// @param amountAMin Minimum amount of token A to receive (slippage protection)
    /// @param amountBMin Minimum amount of token B to receive (slippage protection)
    /// @param to Address receiving withdrawn tokens
    /// @param deadline Expiration timestamp for this transaction
    /// @return amountA Amount of token A returned
    /// @return amountB Amount of token B returned
    function removeLiquidity(
        address addTokenA,
        address addTokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        validTokenPair(addTokenA, addTokenB)
        notExpired(deadline)
        validRecipient(to)
        returns (uint256 amountA, uint256 amountB)
    {
        require(liquidity > 0, "Zero liquidity");
        require(
            liquidityBalance[msg.sender] >= liquidity,
            "Not enough liquidity"
        );

        (amountA, amountB) = _calculateWithdrawAmounts(liquidity);

        _validateMinAmounts(amountA, amountB, amountAMin, amountBMin);

        _burnLiquidityAndUpdateState(msg.sender, liquidity, amountA, amountB);
        _transferTokensToUser(to, amountA, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }

    /// @dev Calculates token amounts to withdraw based on burned liquidity
    /// @param liquidity Amount of liquidity tokens to burn
    /// @return amountA Token A returned
    /// @return amountB Token B returned
    function _calculateWithdrawAmounts(uint256 liquidity)
        internal
        view
        returns (uint256 amountA, uint256 amountB)
    {
        amountA = (liquidity * reserveA) / totalLiquidity;
        amountB = (liquidity * reserveB) / totalLiquidity;
    }

    /// @dev Validates that actual withdrawal meets minimum constraints
    /// @param amountA Actual token A withdrawn
    /// @param amountB Actual token B withdrawn
    /// @param amountAMin Minimum acceptable token A
    /// @param amountBMin Minimum acceptable token B
    function _validateMinAmounts(
        uint256 amountA,
        uint256 amountB,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal pure {
        require(amountA >= amountAMin, "amountA < amountAMin");
        require(amountB >= amountBMin, "amountB < amountBMin");
    }

    /// @dev Burns liquidity and updates reserves and user balances
    /// @param user The address of the liquidity provider
    /// @param liquidity Amount of liquidity tokens to burn
    /// @param amountA Token A amount withdrawn
    /// @param amountB Token B amount withdrawn
    function _burnLiquidityAndUpdateState(
        address user,
        uint256 liquidity,
        uint256 amountA,
        uint256 amountB
    ) internal {
        liquidityBalance[user] -= liquidity;
        totalLiquidity -= liquidity;
        reserveA -= amountA;
        reserveB -= amountB;
    }

    function _transferTokensToUser(
        address to,
        uint256 amountA,
        uint256 amountB
    ) internal {
        require(IERC20(tokenA).transfer(to, amountA), "Transfer tokenA failed");
        require(IERC20(tokenB).transfer(to, amountB), "Transfer tokenB failed");
    }

   /// @notice Computes the floor square root of a given number using Babylonian method
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        for (uint8 i = 0; i < 7; ++i) {
            y = z;
            z = (y + x / y) / 2;
        }
        if (y * y > x) y--; 
    }
}

