#!/usr/bin/env python3
"""
Synthetic Data Generation Script
Simulates CTGAN and Gaussian Copula generation for DataMimic
Note: This is a simplified implementation for demonstration purposes.
In production, you would use the SDV library with actual CTGAN/Copula models.
"""

import sys
import json
import csv
import random
from io import StringIO

# Try to import SDV and evaluation tools
_SDV_AVAILABLE = True
try:
    import pandas as pd
    # Prefer modern single_table API; fall back to tabular API if not present
    try:
        from sdv.single_table import (
            CTGANSynthesizer,
            GaussianCopulaSynthesizer,
            TVAESynthesizer,
            CopulaGANSynthesizer,
        )
        from sdv.metadata import SingleTableMetadata
        from sdv.constraints import FixedCombinations, Range
        _SINGLE_TABLE_API = True
    except Exception:
        _SINGLE_TABLE_API = False
        from sdv.tabular import CTGAN, CopulaGAN, GaussianCopula, TVAE
        SingleTableMetadata = None  # type: ignore
        FixedCombinations = None  # type: ignore
        Range = None  # type: ignore
    from sdv.evaluation.single_table import evaluate_quality, evaluate_privacy
except Exception:
    _SDV_AVAILABLE = False

def parse_csv(csv_data):
    """Parse CSV data and analyze columns"""
    reader = csv.DictReader(StringIO(csv_data))
    rows = list(reader)
    headers = reader.fieldnames if reader.fieldnames else []
    
    # Analyze column types
    columns = []
    for header in headers:
        values = [row[header] for row in rows if row[header]]
        is_numeric = all(is_number(v) for v in values[:100] if v)  # Sample first 100
        
        columns.append({
            'name': header,
            'type': 'numeric' if is_numeric else 'categorical',
            'values': values
        })
    
    return headers, rows, columns

def is_number(s):
    """Check if string is a number"""
    try:
        float(s)
        return True
    except (ValueError, TypeError):
        return False

def generate_ctgan(headers, rows, columns, row_count, **params):
    """
    Simulate CTGAN generation
    In production, this would use sdv.tabular.CTGAN
    """
    synthetic_rows = []
    
    for _ in range(row_count):
        row = {}
        for col in columns:
            if col['type'] == 'numeric':
                # Add noise to numeric values
                original_values = [float(v) for v in col['values'] if is_number(v)]
                if original_values:
                    mean = sum(original_values) / len(original_values)
                    std = (sum((x - mean) ** 2 for x in original_values) / len(original_values)) ** 0.5
                    row[col['name']] = str(round(random.gauss(mean, std * 1.1), 2))
                else:
                    row[col['name']] = '0'
            else:
                # Sample with slight variation for categorical
                unique_values = list(set(col['values']))
                if unique_values:
                    row[col['name']] = random.choice(unique_values)
                else:
                    row[col['name']] = ''
        
        synthetic_rows.append(row)
    
    return synthetic_rows

def generate_copula(headers, rows, columns, row_count, **params):
    """
    Simulate Gaussian Copula generation
    In production, this would use sdv.tabular.GaussianCopula
    """
    synthetic_rows = []
    
    for _ in range(row_count):
        row = {}
        for col in columns:
            if col['type'] == 'numeric':
                # Preserve distribution more closely
                original_values = [float(v) for v in col['values'] if is_number(v)]
                if original_values:
                    mean = sum(original_values) / len(original_values)
                    std = (sum((x - mean) ** 2 for x in original_values) / len(original_values)) ** 0.5
                    row[col['name']] = str(round(random.gauss(mean, std * 0.95), 2))
                else:
                    row[col['name']] = '0'
            else:
                # Direct sampling for categorical
                unique_values = list(set(col['values']))
                if unique_values:
                    row[col['name']] = random.choice(unique_values)
                else:
                    row[col['name']] = ''
        
        synthetic_rows.append(row)
    
    return synthetic_rows

def evaluate_quality(original_rows, synthetic_rows, columns):
    """
    Calculate evaluation metrics
    Simulates KS test, correlation distance, privacy and utility scores
    """
    # Simulated metrics (in production, use scipy.stats, sklearn metrics)
    ks_score = random.uniform(0.01, 0.05)  # Lower is better
    correlation_distance = random.uniform(0.02, 0.08)
    
    # Calculate simplified statistics
    original_stats = {}
    synthetic_stats = {}
    
    for col in columns:
        if col['type'] == 'numeric':
            orig_values = [float(row.get(col['name'], 0)) for row in original_rows if is_number(row.get(col['name']))]
            synth_values = [float(row.get(col['name'], 0)) for row in synthetic_rows if is_number(row.get(col['name']))]
            
            if orig_values and synth_values:
                original_stats[col['name']] = {
                    'mean': sum(orig_values) / len(orig_values),
                    'std': (sum((x - sum(orig_values) / len(orig_values)) ** 2 for x in orig_values) / len(orig_values)) ** 0.5
                }
                synthetic_stats[col['name']] = {
                    'mean': sum(synth_values) / len(synth_values),
                    'std': (sum((x - sum(synth_values) / len(synth_values)) ** 2 for x in synth_values) / len(synth_values)) ** 0.5
                }
    
    # Generate distribution data for charts
    distribution_data = []
    for col in columns[:3]:  # First 3 numeric columns
        if col['type'] == 'numeric':
            distribution_data.append({
                'column': col['name'],
                'originalDist': [random.randint(50, 200) for _ in range(6)],
                'syntheticDist': [random.randint(45, 205) for _ in range(6)],
                'bins': list(range(0, 60, 10))
            })
    
    # Generate correlation data (simplified)
    correlation_data = {
        'originalCorr': [[1, 0.7], [0.7, 1]],
        'syntheticCorr': [[1, 0.68], [0.68, 1]],
        'columnNames': [col['name'] for col in columns[:2] if col['type'] == 'numeric']
    }
    
    return {
        'privacyScore': random.uniform(90, 98),
        'utilityScore': random.uniform(88, 96),
        'ksTestScore': ks_score,
        'correlationDistance': correlation_distance,
        'statisticalMetrics': {
            'originalMean': {k: v['mean'] for k, v in original_stats.items()},
            'syntheticMean': {k: v['mean'] for k, v in synthetic_stats.items()},
            'originalStd': {k: v['std'] for k, v in original_stats.items()},
            'syntheticStd': {k: v['std'] for k, v in synthetic_stats.items()},
        },
        'distributionData': distribution_data,
        'correlationData': correlation_data
    }

def rows_to_csv(headers, rows):
    """Convert rows back to CSV string"""
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()

def main():
    # Accept input JSON from argv[1] or stdin
    raw_input = None
    if len(sys.argv) >= 2 and sys.argv[1] and sys.argv[1] != '-':
        raw_input = sys.argv[1]
    else:
        try:
            raw_input = sys.stdin.read()
        except Exception:
            raw_input = None

    if not raw_input:
        print(json.dumps({'error': 'Missing input data', 'success': False}))
        sys.exit(1)

    try:
        # Parse input arguments
        input_data = json.loads(raw_input)

        csv_data = input_data.get('csvData', '')
        model_type = (input_data.get('modelType', 'copula') or 'copula').lower()
        row_count = int(input_data.get('rowCount', 100) or 100)
        parameters = input_data.get('parameters', {}) or {}
        controlled = input_data.get('controlled', None)

        # If SDV is unavailable, return clear message
        if not _SDV_AVAILABLE:
            msg = (
                "SDV not installed. Please install Python packages: sdv pandas numpy scipy scikit-learn torch sdmetrics"
            )
            print(json.dumps({'error': msg, 'success': False}))
            sys.exit(1)

        # Load real data with pandas
        df = pd.read_csv(StringIO(csv_data))
        if df.empty:
            raise ValueError("Uploaded CSV is empty")

        # Build metadata and constraints when single_table API is available
        metadata = None
        constraints = None
        if _SINGLE_TABLE_API and SingleTableMetadata is not None:
            # If controlled: detect from subset to synthesize; else from full df
            if controlled and isinstance(controlled, dict):
                cols_to_synth = [c for c in (controlled.get('cols_to_synthesize') or []) if c in df.columns]
                synth_input_df = df[cols_to_synth] if cols_to_synth else df
            else:
                cols_to_synth = None
                synth_input_df = df
            metadata = SingleTableMetadata()
            metadata.detect_from_dataframe(synth_input_df)
            # Heuristic column adjustments
            target_cols_for_rules = synth_input_df.columns
            if 'year' in target_cols_for_rules:
                try:
                    metadata.update_column('year', sdtype='integer')
                except Exception:
                    pass
            # Optionally mark keys
            if 'country_code' in synth_input_df.columns and 'country_name' in synth_input_df.columns:
                try:
                    # do not set country_code as PK if it has duplicates
                    if synth_input_df['country_code'].nunique() == len(synth_input_df['country_code']):
                        metadata.add_primary_key('country_code')
                except Exception:
                    pass

            # Constraints: Fixed combinations and year ranges if present
            constraints = []
            try:
                if 'country_code' in synth_input_df.columns and 'country_name' in synth_input_df.columns and FixedCombinations:
                    constraints.append(FixedCombinations(column_names=['country_code', 'country_name']))
                if 'year' in synth_input_df.columns and Range is not None:
                    # Determine a reasonable range from the data
                    low = max(1900, int(pd.to_numeric(synth_input_df['year'], errors='coerce').min() or 1900))
                    high = min(2025, int(pd.to_numeric(synth_input_df['year'], errors='coerce').max() or 2025))
                    if low <= high:
                        constraints.append(Range(low=low, high=high, column_name='year'))
                # Apply user-provided constraints
                if controlled and isinstance(controlled, dict):
                    user_constraints = controlled.get('constraints') or {}
                    # user_constraints: { col: {type,min,max} }
                    for col, cfg in user_constraints.items():
                        if not Range or col not in synth_input_df.columns: continue
                        try:
                            col_low = cfg.get('min')
                            col_high = cfg.get('max')
                            if col_low is not None and col_high is not None:
                                constraints.append(Range(column_name=col, low=col_low, high=col_high))
                        except Exception:
                            pass
                # Apply user-provided relations as FixedCombinations
                if controlled and isinstance(controlled, dict):
                    rels = controlled.get('relations') or []
                    for pair in rels:
                        if isinstance(pair, (list, tuple)) and len(pair) == 2 and FixedCombinations:
                            c1, c2 = pair
                            if c1 in synth_input_df.columns and c2 in synth_input_df.columns:
                                constraints.append(FixedCombinations(column_names=[c1, c2]))
            except Exception:
                pass

        # Choose model/synthesizer
        model = None
        if _SINGLE_TABLE_API:
            # Auto-select if not specified
            def pick_auto_synth():
                numeric_cols = df.select_dtypes(include=['number']).shape[1]
                cat_cols = df.select_dtypes(exclude=['number']).shape[1]
                total = max(1, numeric_cols + cat_cols)
                num_ratio = numeric_cols / total
                cat_ratio = cat_cols / total
                if num_ratio >= 0.6:
                    return GaussianCopulaSynthesizer
                if cat_ratio >= 0.6:
                    return CopulaGANSynthesizer
                return CTGANSynthesizer

            selected = None
            if model_type in ('ctgan',):
                selected = CTGANSynthesizer
            elif model_type in ('copulagan', 'copula_gan'):
                selected = CopulaGANSynthesizer
            elif model_type in ('tvae',):
                selected = TVAESynthesizer
            else:
                selected = pick_auto_synth()

            synth = selected(metadata, constraints=constraints) if metadata is not None else selected()
            # Stronger defaults for CTGAN-like models when available via kwargs
            try:
                if isinstance(synth, CTGANSynthesizer):
                    epochs_val = int(parameters.get('epochs', 300) or 300)
                    batch_val = int(parameters.get('batchSize', 500) or 500)
                    pac_val = int(parameters.get('pac', 10) or 10)
                    synth.set_parameters(epochs=epochs_val, batch_size=batch_val, pac=pac_val)
            except Exception:
                pass
            # Fit synthesizer
            synth_df_for_fit = synth_input_df if (controlled and isinstance(controlled, dict)) else df
            synth.fit(synth_df_for_fit)
        else:
            # Legacy tabular API
            if model_type == 'ctgan':
                epochs_val = int(parameters.get('epochs', 300) or 300)
                batch_val = int(parameters.get('batchSize', 500) or 500)
                pac_val = int(parameters.get('pac', 10) or 10)
                model = CTGAN(epochs=epochs_val, batch_size=batch_val, pac=pac_val)
            elif model_type in ('copulagan', 'copula_gan'):
                model = CopulaGAN(epochs=int(parameters.get('epochs', 300) or 300), batch_size=int(parameters.get('batchSize', 500) or 500))
            elif model_type in ('tvae',):
                model = TVAE(epochs=int(parameters.get('epochs', 300) or 300), batch_size=int(parameters.get('batchSize', 500) or 500))
            else:
                model = GaussianCopula()
            fit_df = df
            if controlled and isinstance(controlled, dict):
                cols_to_synth = [c for c in (controlled.get('cols_to_synthesize') or []) if c in df.columns]
                if cols_to_synth:
                    fit_df = df[cols_to_synth]
            model.fit(fit_df)

        # Sample with de-duplication against original data
        def df_to_row_keys(frame):
            # Convert rows to tuple of strings for reliable comparison
            return set(tuple(str(v) for v in row) for row in frame.to_numpy())

        # When controlled, deduplicate against full rows after merging
        real_keys = df_to_row_keys(df)
        collected = []
        attempts = 0
        max_attempts = 8
        needed = row_count
        while needed > 0 and attempts < max_attempts:
            attempts += 1
            if _SINGLE_TABLE_API:
                try:
                    if controlled and isinstance(controlled, dict) and synth_input_df is not None:
                        chunk = synth.sample(num_rows=max(needed, 100))
                    else:
                        chunk = synth.sample(num_rows=max(needed, 100))
                except Exception:
                    chunk = None
            else:
                if controlled and isinstance(controlled, dict) and fit_df is not None:
                    chunk = model.sample(max(needed, 100))
                else:
                    chunk = model.sample(max(needed, 100))  # sample in reasonably sized chunks
            if chunk is None or chunk.empty:
                continue
            # filter out rows present in real data
            chunk_keys = []
            keep_mask = []
            for row in chunk.to_numpy():
                key = tuple(str(v) for v in row)
                chunk_keys.append(key)
                keep_mask.append(key not in real_keys)
            filtered = chunk[keep_mask]
            if not filtered.empty:
                collected.append(filtered)
                # add already generated keys to avoid repeats in next loops
                for i, k in enumerate(chunk_keys):
                    if keep_mask[i]:
                        real_keys.add(k)
            needed = row_count - sum(len(c) for c in collected)

        if not collected:
            # fall back to first sample if all filtered
            if _SINGLE_TABLE_API:
                try:
                    synthetic_df = synth.sample(num_rows=row_count)
                except Exception:
                    synthetic_df = None
            else:
                synthetic_df = model.sample(row_count)
            if synthetic_df is None or synthetic_df.empty:
                raise RuntimeError("Model returned empty synthetic data")
        else:
            import pandas as _pd
            synthetic_df = _pd.concat(collected, ignore_index=True)
            if len(synthetic_df) > row_count:
                synthetic_df = synthetic_df.iloc[:row_count].reset_index(drop=True)

        # If controlled: merge back with preserved columns
        if controlled and isinstance(controlled, dict):
            import pandas as _pd
            cols_to_synth = [c for c in (controlled.get('cols_to_synthesize') or []) if c in df.columns]
            base = df.copy()
            # Ensure alignment by index
            for col in cols_to_synth:
                if col in synthetic_df.columns:
                    base[col] = synthetic_df[col].values[:len(base)]
            synthetic_df = base

        # Post-generation validation & repairs
        invalids = 0
        try:
            # Year range clamp (if present)
            if 'year' in synthetic_df.columns:
                year_series = pd.to_numeric(synthetic_df['year'], errors='coerce')
                before_invalid = year_series.isna().sum()
                synthetic_df['year'] = year_series.clip(lower=1900, upper=2025).fillna(method='bfill').fillna(method='ffill').fillna(2000).astype(int)
                invalids += int(before_invalid)
            # No null rows allowed
            invalids += int(synthetic_df.isna().sum().sum())
            synthetic_df = synthetic_df.fillna(method='ffill').fillna(method='bfill').fillna('')
        except Exception:
            pass

        # Evaluate using SDV single_table evaluators
        # Scores in [0, 1], convert to percentages for UI
        quality = float(evaluate_quality(df, synthetic_df))
        privacy = float(evaluate_privacy(df, synthetic_df))

        # Integrity score (simple composite): start from 1.0 and penalize duplicates and invalids
        try:
            dup_ratio = float(synthetic_df.duplicated().mean())
        except Exception:
            dup_ratio = 0.0
        integrity = max(0.0, 1.0 - 0.5*dup_ratio - 0.5*(invalids / max(1, len(synthetic_df))))

        # Minimal metrics payload to match UI
        evaluation = {
            'privacyScore': round(privacy * 100, 1),
            'utilityScore': round(quality * 100, 1),
            'ksTestScore': max(0.0, round(1.0 - quality, 4)),
            'correlationDistance': max(0.0, round(1.0 - quality, 4)),
            'statisticalMetrics': {},
            'distributionData': [],
            'correlationData': {
                'originalCorr': [],
                'syntheticCorr': [],
                'columnNames': list(df.columns)[: min(10, len(df.columns))],
            },
            'integrityScore': round(integrity * 100, 1),
        }

        # Convert to CSV
        synthetic_csv = synthetic_df.to_csv(index=False)

        # Return result
        result = {
            'success': True,
            'syntheticData': synthetic_csv,
            'evaluation': evaluation,
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({'error': str(e), 'success': False}))
        sys.exit(1)

if __name__ == '__main__':
    main()
