# Chiến lược đầu tư Abunfi

Abunfi sử dụng một hệ thống quản lý chiến lược đa dạng để tối ưu hóa lợi nhuận và giảm thiểu rủi ro cho người dùng. Tất cả các chiến lược được quản lý tự động bởi `StrategyManager` với khả năng đánh giá rủi ro và phân bổ động.

## 🏗️ Kiến trúc Strategy Manager

### StrategyManager.sol
- **Quản lý rủi ro**: Đánh giá và phân loại rủi ro cho từng chiến lược (0-100)
- **Phân bổ động**: Tự động điều chỉnh allocation dựa trên performance và điều kiện thị trường
- **Theo dõi APY**: Lưu trữ lịch sử APY và tính toán moving average
- **Rebalancing**: Tự động rebalance khi deviation vượt ngưỡng cho phép

## 💼 Các chiến lược đầu tư

### 🏦 1. Lending Strategy (Bảo thủ)
**File**: `LendingStrategy.sol`
**Mức rủi ro**: Thấp (10-20)
**APY dự kiến**: 4-6%

#### Mô tả
Cho vay tài sản vào các giao thức lending uy tín để nhận lãi suất ổn định.

#### Protocols được hỗ trợ
- **Aave**: Giao thức lending lớn nhất với TVL $12B+
- **Compound**: Giao thức lending tiên phong với cơ chế lãi suất tự động

#### Tính năng
- Tự động compound lãi suất
- Theo dõi health factor
- Đa dạng hóa giữa các protocols
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

### 🌾 4. Yield Farming Strategy (Nâng cao - Tương lai)
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
