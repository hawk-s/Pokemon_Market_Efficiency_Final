## FIRST ATTEMPT AT RANKING CORRELATION (NOT USED!) - used is the Kendalls Tau in the other script - 'compute_kendalls_tau.ipynb'

import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from scipy.stats import kendalltau
from matplotlib.colors import TwoSlopeNorm

# -------------------------
# 1. Data Setup
# -------------------------

# Rankings (lower = more efficient)
min_pvals = {
    'W5': 0.0015, 'W7': 2.7e-06, 'W6': 5.3e-07, 'W1': 4.9e-08,
    'W4': 4.6e-08, 'W9': 3.7e-09, 'W3': 4.1e-13, 'W2': 5.5e-13, 'W8': 2.1e-15
}

avg_improvements = {
    'W5': 6.42, 'W7': 10.47, 'W4': 11.58, 'W1': 18.96,
    'W3': 16.85, 'W8': 18.55, 'W6': 18.61, 'W2': 21.29, 'W9': 21.60
}

kv_distances = {
    'W7': 0.090, 'W5': 0.497, 'W3': 0.678, 'W4': 1.017,
    'W2': 1.202, 'W1': 1.304, 'W8': 1.535, 'W6': 2.192, 'W9': 2.406
}

# Volatility of Volatility
vov = {
    'W2': 0.306, 'W8': 0.212, 'W1': 0.209, 'W4': 0.188,
    'W3': 0.183, 'W7': 0.139, 'W9': 0.125, 'W6': 0.121, 'W5': 0.069
}

# Series Properties
volume = {
    'W7': 1582, 'W5': 961, 'W3': 2021, 'W4': 1691,
    'W1': 1271, 'W2': 2842, 'W6': 1770, 'W8': 1544, 'W9': 1094
}

population = {
    'W7': 25986, 'W5': 7771, 'W3': 13344, 'W4': 8139,
    'W1': 10813, 'W2': 22243, 'W6': 19405, 'W8': 10694, 'W9': 10994
}

# -------------------------
# 2. Rankings and Half-Rank Agreement
# -------------------------

def get_rank(series, reverse=False):
    return pd.Series(series).rank(ascending=not reverse, method='min')

# Convert to DataFrames
df = pd.DataFrame({
    'Min_p': min_pvals,
    'Avg_Improv': avg_improvements,
    'K&V_Distance': kv_distances,
    'VoV': vov,
    'Volume': volume,
    'Population': population
}).T

df = df.T

# Rankings: Lower = More Efficient
rankings = df[['Min_p', 'Avg_Improv', 'K&V_Distance']].rank(method='min')

# Half-rank agreement
half_threshold = len(df) // 2 + (len(df) % 2 > 0)  # 5 if 9 cards

half_flags = rankings.apply(lambda col: col <= half_threshold)
agreement_matrix = pd.DataFrame(index=df.index, columns=['L-B vs Improv', 'L-B vs K&V', 'Improv vs K&V'])

agreement_matrix['L-B vs Improv'] = (half_flags['Min_p'] == half_flags['Avg_Improv'])
agreement_matrix['L-B vs K&V'] = (half_flags['Min_p'] == half_flags['K&V_Distance'])
agreement_matrix['Improv vs K&V'] = (half_flags['Avg_Improv'] == half_flags['K&V_Distance'])

print("\nHalf-Rank Agreement Matrix:")
print(agreement_matrix)

# -------------------------
# 3. Kendall's Tau Correlation
# -------------------------

tau_matrix = pd.DataFrame(index=rankings.columns, columns=rankings.columns, dtype=float)
pval_matrix = tau_matrix.copy()

for col1 in rankings.columns:
    for col2 in rankings.columns:
        tau, pval = kendalltau(rankings[col1], rankings[col2])
        tau_matrix.loc[col1, col2] = tau
        pval_matrix.loc[col1, col2] = pval

print("\nKendall's Tau Matrix:")
print(tau_matrix)

# -------------------------
# 4. Heatmap of All Metrics
# -------------------------

# Normalize columns for heatmap
def normalize_column(col):
    return (col - col.min()) / (col.max() - col.min())

norm_df = df.apply(normalize_column)

# Custom color map: green (efficient) to red (inefficient)
cmap = sns.diverging_palette(150, 10, as_cmap=True)

plt.figure(figsize=(10, 6))
sns.heatmap(norm_df.T, cmap=cmap, annot=True, fmt=".2f", cbar_kws={'label': 'Normalized Value'})
plt.title("Efficiency and Series Properties Heatmap (Normalized)")
plt.tight_layout()
plt.show()


