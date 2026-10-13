"""
Scoring and Evaluation Script for ClauseLens / Clausewise
Calculates Precision, Recall, F1, and Correct Abstention per clause type
against ground truth labels from the CUAD dataset.
"""

import os
import json
from typing import Dict, List, Any

TARGET_CLAUSES = [
    "Governing Law",
    "Termination for Convenience",
    "Cap on Liability",
    "Audit Rights",
    "Non-Compete",
    "Exclusivity",
    "Anti-Assignment",
    "Renewal Term",
    "Expiration Date",
    "Effective Date"
]

def evaluate_predictions(ground_truth: Dict[str, Any], predictions: Dict[str, Any]):
    stats = {
        clause: {
            "tp": 0,
            "fp": 0,
            "fn": 0,
            "tn": 0,
            "quote_matches": 0,
            "total_present": 0,
            "total_absent": 0
        }
        for clause in TARGET_CLAUSES
    }

    for contract_id, truth_data in ground_truth.items():
        pred_data = predictions.get(contract_id, {}).get("clauses", {})
        
        for clause_name in TARGET_CLAUSES:
            gt_clause = truth_data["labels"].get(clause_name, {"present": False, "value": "", "quote": ""})
            pred_clause = pred_data.get(clause_name, {"present": False, "value": "", "quote": ""})

            is_gt_present = gt_clause.get("present", False)
            is_pred_present = pred_clause.get("present", False)

            if is_gt_present:
                stats[clause_name]["total_present"] += 1
                if is_pred_present:
                    # Check substring quote grounding
                    gt_quote = gt_clause.get("quote", "").lower()
                    pred_quote = pred_clause.get("quote", "").lower()
                    if pred_quote and (pred_quote in gt_quote or gt_quote in pred_quote):
                        stats[clause_name]["tp"] += 1
                        stats[clause_name]["quote_matches"] += 1
                    else:
                        stats[clause_name]["fp"] += 1
                else:
                    stats[clause_name]["fn"] += 1
            else:
                stats[clause_name]["total_absent"] += 1
                if is_pred_present:
                    stats[clause_name]["fp"] += 1  # Hallucinated clause
                else:
                    stats[clause_name]["tn"] += 1  # Correct abstention

    print("\n" + "=" * 95)
    print(f"{'Clause Type':<30} | {'Prec (%)':<9} | {'Rec (%)':<9} | {'F1 (%)':<8} | {'Abstention (%)':<15} | {'Samples':<7}")
    print("-" * 95)

    macro_f1 = []
    for clause, data in stats.items():
        tp = data["tp"]
        fp = data["fp"]
        fn = data["fn"]
        tn = data["tn"]

        prec = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 100.0
        rec = (tp / (tp + fn) * 100) if (tp + fn) > 0 else (100.0 if data["total_present"] == 0 else 0.0)
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        abstention = (tn / data["total_absent"] * 100) if data["total_absent"] > 0 else 100.0

        macro_f1.append(f1)
        samples = data["total_present"] + data["total_absent"]
        print(f"{clause:<30} | {prec:>8.1f}% | {rec:>8.1f}% | {f1:>7.1f}% | {abstention:>14.1f}% | {samples:>7}")

    avg_f1 = sum(macro_f1) / len(macro_f1)
    print("=" * 95)
    print(f"Overall Macro F1 Score: {avg_f1:.2f}%\n")

if __name__ == "__main__":
    gt_file = os.path.join(os.path.dirname(__file__), "..", "data", "ground_truth.json")
    if os.path.exists(gt_file):
        with open(gt_file, "r", encoding="utf-8") as f:
            gt_data = json.load(f)
        
        # Test evaluation with ground truth baseline
        synthetic_preds = {}
        for cid, val in gt_data.items():
            synthetic_preds[cid] = {"clauses": val["labels"]}
            
        print("Running scoring test against CUAD ground truth baseline...")
        evaluate_predictions(gt_data, synthetic_preds)
    else:
        print(f"Ground truth file {gt_file} not found. Run python data/download_cuad.py first.")
