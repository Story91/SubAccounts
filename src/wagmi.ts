import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
import { parseEther, toHex } from 'viem';

interface GetConfigOptions {
  spendLimitAllowance?: `0x${string}`;
  spendLimitPeriod?: number;
}

// Default options if none are provided
const defaultOptions: GetConfigOptions = {
  spendLimitAllowance: toHex(parseEther('0.01')),
  spendLimitPeriod: 86400, // 1 day in seconds
};

export function getConfig(options: GetConfigOptions = defaultOptions) {
  console.log("Creating config with options:", options);
  
  // Use provided options or defaults with proper type assertions
  const allowance = options.spendLimitAllowance ?? defaultOptions.spendLimitAllowance!;
  const period = options.spendLimitPeriod ?? defaultOptions.spendLimitPeriod!;
  
  // Log the actual values we're using
  console.log(`Using allowance: ${allowance} and period: ${period}`);

  return createConfig({
    chains: [baseSepolia, base],
    connectors: [
      coinbaseWallet({
        appName: "My Sub Account Demo",
        preference: {
          keysUrl: "https://keys-dev.coinbase.com/connect",
          options: "smartWalletOnly",
        },
        subAccounts: {
          enableAutoSubAccounts: true,
          defaultSpendLimits: {
            84532: [
              {
                token: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                allowance: allowance,
                period: period,
              },
            ],
            8453: [
              {
                token: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                allowance: allowance,
                period: period,
              },
            ],
          },
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
  });
}

// Helper function for debugging
export function getConfigWithHumanReadableLimits(ethAmount: string, periodInDays: number = 1) {
  const weiAmount = parseEther(ethAmount);
  const secondsInPeriod = periodInDays * 86400;
  
  return getConfig({
    spendLimitAllowance: toHex(weiAmount),
    spendLimitPeriod: secondsInPeriod
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
