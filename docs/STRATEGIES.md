# Abunfi Investment Strategies

Abunfi uses a diverse strategy management system to optimize profits and minimize risks for users. All strategies are automatically managed by `StrategyManager` with risk assessment and dynamic allocation capabilities.

## 🏗️ Strategy Manager Architecture

### StrategyManager.sol
- **Risk Management**: Assess and classify risk for each strategy (0-100)
- **Dynamic Allocation**: Automatically adjust allocation based on performance and market conditions
- **APY Tracking**: Store APY history and calculate moving averages
- **Rebalancing**: Automatically rebalance when deviation exceeds allowed threshold

## 💼 Investment Strategies

### 🏦 1. Lending Strategy (Conservative)
**File**: `LendingStrategy.sol`
**Risk Level**: Low (10-20)
**Expected APY**: 4-6%

#### Description
Lend assets to reputable lending protocols to receive stable interest rates.

#### Supported Protocols
- **Aave**: Largest lending protocol with TVL $12B+
- **Compound**: Pioneer lending protocol with automatic interest mechanism

#### Features
- Automatic compound interest
- Health factor monitoring
- Diversification across protocols
- Quản lý collateral ratio

---

### ⚖️ 2. Liquidity Providing Strategy (Cân bằng)
**File**: `LiquidityProvidingStrategy.sol`
**Mức rủi ro**: Trung bình (20-35)
**APY dự kiến**: 5-8%

#### Mô tả
Cung cấp thanh khoản cho các cặp stablecoin trên các sàn AMM để nhận phí giao dịch và rewards.

#### Protocols được hỗ trợ
- **Curve Finance**: Chuyên về stablecoin swaps với slippage thấp
- **Uniswap V3**: Concentrated liquidity với hiệu quả vốn cao
- **Balancer**: Weighted pools với nhiều tokens
- **SushiSwap**: AMM với liquidity mining rewards

#### Pool types
- **Curve Stable Pools**: USDC/USDT/DAI với slippage tối thiểu
- **Uniswap V3 Concentrated**: Tập trung thanh khoản trong range hẹp
- **Balancer Weighted**: Pools với trọng số khác nhau

#### Tính năng
- Quản lý nhiều pools đồng thời
- Tự động harvest fees và rewards
- Rebalancing giữa các pools
- Kiểm soát slippage và impermanent loss
- Theo dõi APY real-time từ fees và rewards

#### Rủi ro
- **Impermanent Loss**: Giảm thiểu bằng cách focus vào stablecoin pairs
- **Smart Contract Risk**: Đa dạng hóa giữa các protocols đã được audit
- **Slippage**: Kiểm soát bằng slippage tolerance

---

### 🚀 3. Liquid Staking Strategy (Nâng cao)
**File**: `LiquidStakingStrategy.sol`
**Mức rủi ro**: Trung bình-Cao (25-40)
**APY dự kiến**: 4-6%

#### Mô tả
Sử dụng các liquid staking tokens để kiếm lợi nhuận từ Ethereum staking mà vẫn giữ được tính thanh khoản.

#### Providers được hỗ trợ
- **Lido (stETH)**: Largest liquid staking provider với 30%+ market share
- **Rocket Pool (rETH)**: Decentralized staking với node operators
- **Coinbase (cbETH)**: Centralized staking từ Coinbase
- **Frax (sfrxETH)**: Algorithmic staking với dual token model
- **StakeWise (osETH)**: Overcollateralized staking tokens

#### Tính năng
- **Đa dạng hóa providers**: Phân bổ giữa nhiều providers để giảm rủi ro
- **Theo dõi exchange rate**: Monitor tỷ giá staking token/ETH
- **Slashing protection**: Đánh giá và giới hạn slashing risk
- **Auto-compounding**: Tự động reinvest staking rewards
- **Liquidity management**: Quản lý thanh khoản cho withdrawals

#### Allocation Strategy
- **Max per provider**: 40% để tránh concentration risk
- **Risk-based weighting**: Providers với slashing risk thấp hơn được ưu tiên
- **Performance tracking**: Theo dõi APY và consistency của từng provider

#### Rủi ro
- **Slashing Risk**: Validators có thể bị phạt, ảnh hưởng đến staking tokens
- **Centralization Risk**: Một số providers có thể quá tập trung
- **Liquidity Risk**: Có thể có delay khi unstake
- **Smart Contract Risk**: Bugs trong staking contracts

---

### 🦄 4. Uniswap V4 FairFlow Stablecoin Strategy (Nâng cao)
**File**: `UniswapV4FairFlowStablecoinStrategy.sol`
**Mức rủi ro**: Trung bình (25-35)
**APY dự kiến**: 8-12%

#### Mô tả
Chiến lược tiên tiến sử dụng Uniswap V4 FairFlow để cung cấp thanh khoản tập trung cho các cặp stablecoin với tối ưu hóa phí động và quản lý range tự động.

#### Tính năng chính
- **Concentrated Liquidity**: Quản lý thanh khoản trong range 0.2%-1.0% quanh tỷ lệ 1:1
- **Dynamic Range Management**: Tự động điều chỉnh range dựa trên volatility thị trường
- **Automated Rebalancing**: Tự động rebalance khi giá di chuyển ra khỏi range tối ưu
- **Dynamic Fee Optimization**: Điều chỉnh phí theo thời gian thực dựa trên điều kiện thị trường
- **Auto-Compounding**: Tự động reinvest phí thu được để tối đa hóa lợi nhuận

#### Uniswap V4 Innovations
- **Hooks System**: Sử dụng custom hooks cho quản lý tự động
- **Singleton Architecture**: Tận dụng cải tiến hiệu quả gas của V4
- **Flash Accounting**: Theo dõi balance và settlement được tối ưu
- **Market-Responsive Fees**: Phí thích ứng với điều kiện thị trường

#### Supported Pairs
- **USDC/USDT**: Cặp stablecoin chính với volume cao nhất
- **USDC/DAI**: Cặp ổn định với slippage thấp
- **USDT/DAI**: Cặp phụ cho đa dạng hóa

#### Risk Management
- **Impermanent Loss Protection**: Giảm thiểu IL thông qua quản lý range chặt chẽ
- **Emergency Exit**: Cơ chế an toàn cho điều kiện thị trường cực đoan
- **Slippage Controls**: Kiểm soát tolerance và bảo vệ có thể cấu hình
- **Access Controls**: Hạn chế vault và owner phù hợp

#### Performance Metrics
- **Capital Efficiency**: Tối đa hóa việc tạo phí thông qua concentrated liquidity
- **Gas Optimization**: Tận dụng kiến trúc singleton của V4
- **Real-time Optimization**: Điều chỉnh liên tục theo điều kiện thị trường

---

### 🌾 5. Yield Farming Strategy (Nâng cao - Tương lai)
**File**: `YieldFarmingStrategy.sol`
**Mức rủi ro**: Cao (40-60)
**APY dự kiến**: 8-15%

#### Mô tả
Tham gia vào các chương trình yield farming để nhận rewards cao hơn.

#### Protocols
- **Convex Finance**: Boost Curve rewards
- **Yearn Finance**: Automated yield farming vaults
- **Beefy Finance**: Multi-chain yield optimization

---

## 🎯 Strategy Allocation Logic

### Risk-Based Allocation
```
Total Risk Score = Σ(Strategy Weight × Strategy Risk × Allocation %)

Target: Keep total risk score below user's risk tolerance
```

### Performance-Based Weighting
```
Strategy Score = (APY × Performance Consistency) / Risk Score
Allocation % = Strategy Score / Total Score
```

### Constraints
- **Min Allocation**: 5% per active strategy
- **Max Allocation**: 
  - Conservative strategies: 60%
  - Balanced strategies: 40%
  - Advanced strategies: 30%

## 🔄 Rebalancing Logic

### Triggers
1. **Performance deviation**: >5% từ optimal allocation
2. **Time-based**: Mỗi 7 ngày
3. **Market conditions**: Thay đổi lớn về APY hoặc risk

### Process
1. Calculate optimal allocations based on current metrics
2. Compare with current allocations
3. Execute rebalancing if deviation > threshold
4. Update performance metrics

## 📊 Risk Management

### Risk Categories
- **0-20**: Conservative (Lending, Stablecoin farming)
- **21-40**: Balanced (Liquidity providing, Basic yield farming)
- **41-60**: Advanced (Complex yield farming, Leveraged strategies)
- **61-80**: Aggressive (High-risk, high-reward strategies)
- **81-100**: Speculative (Experimental strategies)

### Risk Controls
- **Diversification**: Không quá 40% vào một strategy
- **Liquidity requirements**: Ít nhất 20% trong strategies có thanh khoản cao
- **Stress testing**: Kiểm tra performance trong điều kiện thị trường xấu
- **Emergency withdrawal**: Khả năng withdraw nhanh khi cần thiết

## 🔍 Monitoring & Analytics

### Performance Metrics
- **APY tracking**: Real-time và historical
- **Sharpe ratio**: Risk-adjusted returns
- **Maximum drawdown**: Worst-case scenario analysis
- **Volatility**: Standard deviation của returns

### Health Checks
- **Smart contract audits**: Tất cả strategies được audit
- **TVL monitoring**: Theo dõi Total Value Locked của protocols
- **Liquidity depth**: Đảm bảo có đủ thanh khoản cho withdrawals
- **Oracle price feeds**: Giá cả chính xác và real-time

## 🚀 Future Strategies

### Planned Additions
1. **Cross-chain strategies**: Arbitrage giữa các chains
2. **Options strategies**: Covered calls, protective puts
3. **Real-world assets**: Tokenized bonds, real estate
4. **AI-driven strategies**: Machine learning optimization

### Research Areas
- **MEV strategies**: Maximum Extractable Value opportunities
- **Governance participation**: Voting rewards từ DAO tokens
- **Insurance protocols**: Nexus Mutual, Cover Protocol
- **Synthetic assets**: Synthetix, Mirror Protocol
