import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe  # path effects import
from matplotlib.ticker import FuncFormatter, MultipleLocator
import matplotlib.gridspec as gridspec
import argparse

# Constants for plotting
STEP = 1.5
MAX_DISPLAY = 25

ENTROPY_CONFIG = {
    "bins": 51,
    "range": [0.00, 2.50],
    "max_display": 25
}

CONFIDENCE_CONFIG = {
    "bins": 51,
    "range": [-2.50, 10.00],
    "max_display": 25
}

def count_formatter(x, pos):
    if x == 0:
        return '0'
    val = abs(x) / STEP
    return str(int(round(val)))

def make_break_marks_x(ax, x_pos):
    kwargs = dict(transform=ax.get_xaxis_transform(), color='k', clip_on=False)
    dx = 0.3
    dy = 0.02
    ax.plot([x_pos - dx, x_pos + dx], [-dy, dy], **kwargs)
    ax.plot([x_pos - dx, x_pos + dx], [-2*dy, 2*dy], **kwargs)

def plot_left_distribution(ax, vals_unlearn, vals_retrain, precomputed_scores, legend_unlearn, legend_retrain, max_display, mode='entropy', direction='unlearn'):
    # Use the precomputed scores to determine the optimal threshold
    if not precomputed_scores:
        return None
    best_s = max(precomputed_scores, key=lambda s: s["attack_score"])
    best_thr = best_s["threshold"]

    # Determine the range and bins based on mode
    if mode == 'entropy':
        bins = ENTROPY_CONFIG["bins"]
        range_vals = ENTROPY_CONFIG["range"]
    else:
        bins = CONFIDENCE_CONFIG["bins"]
        range_vals = CONFIDENCE_CONFIG["range"]

    arr_un = np.clip(vals_unlearn, range_vals[0], range_vals[1])
    arr_re = np.clip(vals_retrain, range_vals[0], range_vals[1])
    c_re, bin_edges = np.histogram(arr_re, bins=bins-1, range=range_vals)
    c_un, _ = np.histogram(arr_un, bins=bins-1, range=range_vals)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    # Define colors
    col_fp = '#2B2B2B'
    col_tn = 'gray'
    col_tp = '#5B21B6'
    col_fn = '#8B5CF6'

    # Define prediction function using best threshold
    if mode == 'entropy':
        if direction == 'unlearn':
            pred_unlearn = lambda val: val >= best_thr
        else:
            pred_unlearn = lambda val: val < best_thr
    else:  # mode == 'confidence'
        if direction == 'retrain':
            pred_unlearn = lambda val: val <= best_thr
        else:
            pred_unlearn = lambda val: val > best_thr

    marker_sz = 7
    start = 0.5
    break_left = False
    break_right = False

    for bin_val, re_count, un_count in zip(bin_centers, c_re, c_un):
        # Left side (Retrain)
        if pred_unlearn(bin_val):
            re_color = col_fp
        else:
            re_color = col_tn

        if re_count <= max_display:
            for i in range(re_count):
                x_val = -(i + start) * STEP
                ax.plot(x_val, bin_val, 'o', color=re_color, alpha=0.7, markersize=marker_sz)
        else:
            for i in range(max_display):
                x_val = -(i + start) * STEP
                ax.plot(x_val, bin_val, 'o', color=re_color, alpha=0.7, markersize=marker_sz)
            x_label_pos = -(max_display + 2 + start) * STEP
            ax.plot(x_label_pos, bin_val, 'o', color=re_color, alpha=0.7, markersize=marker_sz)
            ax.text(x_label_pos, bin_val, str(re_count), color=re_color,
                    ha='center', va='center', fontsize=7)
            break_left = True

        # Right side (Unlearn)
        if pred_unlearn(bin_val):
            un_color = col_tp
        else:
            un_color = col_fn

        if un_count <= max_display:
            for i in range(un_count):
                x_val = (i + start) * STEP
                ax.plot(x_val, bin_val, 'o', color=un_color, alpha=0.7, markersize=marker_sz)
        else:
            for i in range(max_display):
                x_val = (i + start) * STEP
                ax.plot(x_val, bin_val, 'o', color=un_color, alpha=0.7, markersize=marker_sz)
            x_label_pos = (max_display + 2 + start) * STEP
            ax.plot(x_label_pos, bin_val, 'o', color=un_color, alpha=0.7, markersize=marker_sz)
            ax.text(x_label_pos, bin_val, str(un_count), color=un_color,
                    ha='center', va='center', fontsize=7)
            break_right = True

    x_max = (max_display + 3 + start) * STEP
    ax.set_xlim([-x_max, x_max])
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    if break_left:
        make_break_marks_x(ax, -(max_display + 1 + start) * STEP)
    if break_right:
        make_break_marks_x(ax, (max_display + 1 + start) * STEP)

    ax.axhline(y=best_thr, color='#4D4D4D', linestyle='--', alpha=0.5)

    txt = f"Optimal threshold: {best_thr:.2f}\n(Forgetting Score = {1 - best_s['attack_score']:.3f})"
    ax.text(0.02, 0.98, txt, transform=ax.transAxes,
            va='top', color='black',
            bbox=dict(facecolor='white', alpha=0.8))
    ax.grid(axis='x', alpha=0.2)
    custom_handles = [
        plt.Line2D([0], [0], marker='o', color='w',
                   markerfacecolor='#2B2B2B', markersize=8,
                   label='From Retrain / Pred. Unlearn (FP)'),
        plt.Line2D([0], [0], marker='o', color='w',
                   markerfacecolor='gray', markersize=8,
                   label='From Retrain / Pred. Retrain (TN)'),
        plt.Line2D([0], [0], marker='o', color='w',
                   markerfacecolor='#5B21B6', markersize=8,
                   label='From Unlearn / Pred. Unlearn (TP)'),
        plt.Line2D([0], [0], marker='o', color='w',
                   markerfacecolor='#8B5CF6', markersize=8,
                   label='From Unlearn / Pred. Retrain (FN)')
    ]
    ax.legend(handles=custom_handles, loc='upper right', fontsize=8)
    return precomputed_scores

def plot_right_line(ax_line, precomputed_scores, range_vals, mode='entropy', direction='unlearn'):
    if not precomputed_scores:
        return
    sorted_scores = sorted(precomputed_scores, key=lambda s: s['threshold'])
    thr_list = np.array([s['threshold'] for s in sorted_scores])
    attack_list = np.array([s['attack_score'] for s in sorted_scores])
    fpr_arr = np.array([s['fpr'] for s in sorted_scores])
    fnr_arr = np.array([s['fnr'] for s in sorted_scores])
    
    # 좌측 플롯과 동일하게 최적의 attack score 기준 threshold를 선택
    best_s = max(precomputed_scores, key=lambda s: s["attack_score"])
    best_thr = best_s["threshold"]
    
    # best_thr와 일치하는 인덱스 추출 (부동소수점 오차 감안)
    idx_arr = np.where(np.isclose(thr_list, best_thr))[0]
    if len(idx_arr) > 0:
        idx = idx_arr[0]
    else:
        idx = np.argmin(np.abs(thr_list - best_thr))
    
    attack_val_at_thr = attack_list[idx]
    fpr_val_at_thr = fpr_arr[idx]
    fnr_val_at_thr = fnr_arr[idx]
    
    # 세 가지 라인 플롯 (Attack Score, FPR, FNR)
    line_attack = ax_line.plot(attack_list, thr_list,
                               color='#E41A1C', alpha=1.0, linewidth=2.0, label='Attack Score')[0]
    line_attack.set_path_effects([pe.Stroke(linewidth=8, foreground='#FFCCCC', alpha=0.5),
                                  pe.Normal()])
    ax_line.plot(fpr_arr, thr_list, color='#377EB8', alpha=1.0, linewidth=2.0, label='False Positive Rate')
    ax_line.plot(fnr_arr, thr_list, color='#4DAF4A', alpha=1.0, linewidth=2.0, label='False Negative Rate')
    
    # x축, y축 및 스파인 설정
    x_min = min(attack_list.min(), fpr_arr.min(), fnr_arr.min())
    x_max = max(1.0, attack_list.max()+0.05, fpr_arr.max()+0.05, fnr_arr.max()+0.05)
    ax_line.set_xlim([x_min, x_max])
    ax_line.set_ylim(range_vals)
    ax_line.set_yticks([])
    ax_line.yaxis.set_ticklabels([])
    for spine in ["top", "right"]:
        ax_line.spines[spine].set_visible(False)
    
    # 오른쪽 그래프 전체에 최적 threshold에 해당하는 수평 점선 표시
    ax_line.axhline(y=best_thr, color='#4D4D4D', linestyle='--', alpha=0.5)
    
    marker_size = 6
    # 빨간 점 (Attack Score 위치)만 원으로 표시
    ax_line.plot(attack_val_at_thr, best_thr, marker='o', markersize=marker_size,
                 markerfacecolor='#E41A1C', markeredgecolor='black')
    
    # 빨간 점 오른쪽 위에 Attack, FPR, FNR 값을 수직으로 표시 (한 개의 텍스트 박스)
    annotation_text = (f"Attack: {attack_val_at_thr:.3f}\n"
                       f"FPR: {fpr_val_at_thr:.3f}\n"
                       f"FNR: {fnr_val_at_thr:.3f}\n"
                       f"Threshold: {best_thr:.3f}")
    ax_line.annotate(annotation_text,
                     xy=(attack_val_at_thr, best_thr),
                     xytext=(10, 10),
                     textcoords="offset points",
                     verticalalignment="bottom",
                     fontsize=8,
                     color='black')
    
    ax_line.set_xlabel("Value")
    ax_line.legend(loc='upper right', fontsize=8)
    ax_line.grid(True, alpha=0.2)

def main():
    parser = argparse.ArgumentParser(description="Visualize attack results from final JSON")
    parser.add_argument('--json', required=True, help="Path to the final JSON file")
    args = parser.parse_args()
    
    with open(args.json, 'r') as f:
        final_json = json.load(f)
    
    # Extract forget_class from the final JSON ('fc' field)
    fc = final_json.get("fc")
    try:
        forget_class = int(fc)
    except:
        print("Invalid forget class in JSON")
        return
    
    # Load pre-saved retrain distribution data.
    retrain_file = f'../../data/{forget_class}/a00{forget_class}.json'
    with open(retrain_file, 'r') as f:
        retrain_raw = json.load(f)
        retrain_values = retrain_raw['attack']['values']
        retrain_data = {
            'entropy': [item['entropy'] for item in retrain_values],
            'confidence': [item['confidence'] for item in retrain_values]
        }
    
    # Unlearn distribution data from final JSON (under attack->values)
    unlearn_values = final_json["attack"]["values"]
    unlearn_data = {
        'entropy': [item['entropy'] for item in unlearn_values],
        'confidence': [item['confidence'] for item in unlearn_values]
    }
    
    # Precomputed attack results from final JSON.
    attack_results = final_json["attack"]["results"]
    
    fig = plt.figure(figsize=(22,15))
    gs = gridspec.GridSpec(nrows=2, ncols=4, width_ratios=[5,2,5,2],
                            height_ratios=[1,1], wspace=0.01, hspace=0.15)
    
    # (A) Entropy + direction='unlearn'
    ax_ent_left = fig.add_subplot(gs[0,0])
    ax_ent_right = fig.add_subplot(gs[0,1])
    pre_ent_unlearn = attack_results.get("entropy_above_unlearn", [])
    sc_ent_u = plot_left_distribution(
        ax=ax_ent_left,
        vals_unlearn=np.array(unlearn_data['entropy']),
        vals_retrain=np.array(retrain_data['entropy']),
        precomputed_scores=pre_ent_unlearn,
        legend_unlearn='Unlearn',
        legend_retrain='Retrain',
        max_display=ENTROPY_CONFIG["max_display"],
        mode='entropy',
        direction='unlearn'
    )
    ax_ent_left.set_title("Entropy (Above => Unlearn)")
    ax_ent_left.xaxis.set_major_locator(MultipleLocator(10*STEP))
    ax_ent_left.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    ax_ent_left.set_xlabel("Count")
    ax_ent_left.set_ylabel("Entropy")
    ax_ent_left.set_ylim(ENTROPY_CONFIG["range"])
    plot_right_line(ax_ent_right, pre_ent_unlearn, ENTROPY_CONFIG["range"], mode='entropy', direction='unlearn')
    
    # (B) Entropy + direction='retrain'
    ax_ent_left2 = fig.add_subplot(gs[0,2])
    ax_ent_right2 = fig.add_subplot(gs[0,3])
    pre_ent_retrain = attack_results.get("entropy_above_retrain", [])
    sc_ent_r = plot_left_distribution(
        ax=ax_ent_left2,
        vals_unlearn=np.array(unlearn_data['entropy']),
        vals_retrain=np.array(retrain_data['entropy']),
        precomputed_scores=pre_ent_retrain,
        legend_unlearn='Unlearn',
        legend_retrain='Retrain',
        max_display=ENTROPY_CONFIG["max_display"],
        mode='entropy',
        direction='retrain'
    )
    ax_ent_left2.set_title("Entropy (Above => Retrain)")
    ax_ent_left2.xaxis.set_major_locator(MultipleLocator(10*STEP))
    ax_ent_left2.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    ax_ent_left2.set_xlabel("Count")
    ax_ent_left2.set_ylabel("Entropy")
    ax_ent_left2.set_ylim(ENTROPY_CONFIG["range"])
    plot_right_line(ax_ent_right2, pre_ent_retrain, ENTROPY_CONFIG["range"], mode='entropy', direction='retrain')
    
    # (C) Confidence + direction='retrain'
    ax_conf_left = fig.add_subplot(gs[1,0])
    ax_conf_right = fig.add_subplot(gs[1,1])
    pre_conf_retrain = attack_results.get("confidence_above_retrain", [])
    sc_conf_r = plot_left_distribution(
        ax=ax_conf_left,
        vals_unlearn=np.array(unlearn_data['confidence']),
        vals_retrain=np.array(retrain_data['confidence']),
        precomputed_scores=pre_conf_retrain,
        legend_unlearn='Unlearn',
        legend_retrain='Retrain',
        max_display=CONFIDENCE_CONFIG["max_display"],
        mode='confidence',
        direction='retrain'
    )
    ax_conf_left.set_title("Confidence (Above => Retrain)")
    ax_conf_left.xaxis.set_major_locator(MultipleLocator(10*STEP))
    ax_conf_left.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    ax_conf_left.set_xlabel("Count")
    ax_conf_left.set_ylabel("Logit Confidence")
    ax_conf_left.set_ylim(CONFIDENCE_CONFIG["range"])
    plot_right_line(ax_conf_right, pre_conf_retrain, CONFIDENCE_CONFIG["range"], mode='confidence', direction='retrain')
    
    # (D) Confidence + direction='unlearn'
    ax_conf_left2 = fig.add_subplot(gs[1,2])
    ax_conf_right2 = fig.add_subplot(gs[1,3])
    pre_conf_unlearn = attack_results.get("confidence_above_unlearn", [])
    sc_conf_u = plot_left_distribution(
        ax=ax_conf_left2,
        vals_unlearn=np.array(unlearn_data['confidence']),
        vals_retrain=np.array(retrain_data['confidence']),
        precomputed_scores=pre_conf_unlearn,
        legend_unlearn='Unlearn',
        legend_retrain='Retrain',
        max_display=CONFIDENCE_CONFIG["max_display"],
        mode='confidence',
        direction='unlearn'
    )
    ax_conf_left2.set_title("Confidence (Above => Unlearn)")
    ax_conf_left2.xaxis.set_major_locator(MultipleLocator(10*STEP))
    ax_conf_left2.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    ax_conf_left2.set_xlabel("Count")
    ax_conf_left2.set_ylabel("Logit Confidence")
    ax_conf_left2.set_ylim(CONFIDENCE_CONFIG["range"])
    plot_right_line(ax_conf_right2, pre_conf_unlearn, CONFIDENCE_CONFIG["range"], mode='confidence', direction='unlearn')
    
    # 전체 figure 상단에 최종 FQS 값을 텍스트로 표시합니다.
    fig.text(0.5, 0.97, f"Final FQS: {final_json['FQS']}", ha='center', fontsize=16, color='blue')
    
    out_filename = f'class_{forget_class}_distribution_comparison_4scenarios.png'
    plt.savefig(out_filename, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Visualization saved to {out_filename}")

if __name__ == "__main__":
    main()
