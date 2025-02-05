import json
import numpy as np
import matplotlib.pyplot as plt
import torch

from matplotlib.ticker import FuncFormatter, MultipleLocator

########################################################################
# 전역 설정
########################################################################
STEP = 1.5
MAX_DISPLAY = 40

def count_formatter(x, pos):
    """
    x축 눈금을 'count'로 표기하기 위한 formatter.
    x==0 일 때 라벨은 '0'
    그 외에는 round(abs(x)/STEP)을 표시
    """
    if x == 0:
        return '0'
    count_val = abs(x) / STEP
    return str(int(round(count_val)))

def make_break_marks_x(ax, x_pos):
    """
    x축 상의 x_pos 근처에 break(잘림) 표시.
    x축 transform: x(data-coord), y([0..1]) axis fraction
    """
    kwargs = dict(transform=ax.get_xaxis_transform(), color='k', clip_on=False)
    dx = 0.3
    dy = 0.02
    ax.plot([x_pos - dx, x_pos + dx], [-dy, dy], **kwargs)
    ax.plot([x_pos - dx, x_pos + dx], [-2*dy, 2*dy], **kwargs)

def calculate_scores(values1, values2, bins, range_vals):
    """
    threshold마다 fpr/fnr/epsilon/forgetting_score를 계산
    """
    if bins < 2:
        print(f"[Warning] bins({bins}) < 2, returning empty.")
        return []
    if range_vals[0] >= range_vals[1]:
        print(f"[Warning] invalid range: {range_vals}. returning empty.")
        return []

    thresholds = np.linspace(range_vals[0], range_vals[1], bins)
    scores = []
    DELTA = 1e-05
    EPSILON = 1e-10

    values1 = np.array(values1)
    values2 = np.array(values2)

    if len(values1) == 0 or len(values2) == 0:
        print("[Warning] empty data. returning empty.")
        return []

    unlearn_median = np.median(values1)
    retrain_median = np.median(values2)
    retrain_is_positive = retrain_median > unlearn_median

    pos_confs_ = torch.from_numpy(values2 if retrain_is_positive else values1)
    neg_confs_ = torch.from_numpy(values1 if retrain_is_positive else values2)

    for threshold in thresholds:
        threshold_ = torch.tensor(threshold)
        tpr = torch.mean((pos_confs_ >= threshold_).float()).item()
        fpr = torch.mean((neg_confs_ >= threshold_).float()).item()
        tnr = torch.mean((neg_confs_ < threshold_).float()).item()
        fnr = torch.mean((pos_confs_ < threshold_).float()).item()

        if fpr == 0 and fnr == 0:
            epsilon = float('inf')
            forgetting_score = 0
        elif fpr >= (1 - DELTA) or fnr >= (1 - DELTA):
            epsilon = 0
            forgetting_score = 1
        else:
            safe_fpr = np.clip(fpr, EPSILON, 1 - DELTA - EPSILON)
            safe_fnr = np.clip(fnr, EPSILON, 1 - DELTA - EPSILON)
            log_ratio1 = np.log(1 - DELTA - safe_fpr) - np.log(safe_fnr)
            log_ratio2 = np.log(1 - DELTA - safe_fnr) - np.log(safe_fpr)
            epsilon = max(0, min(log_ratio1, log_ratio2))
            forgetting_score = 2 ** (-epsilon)

        scores.append({
            'threshold': float(threshold),
            'fpr': fpr,
            'fnr': fnr,
            'epsilon': epsilon,
            'forgetting_score': forgetting_score
        })

    return scores

def plot_distributions(ax, values_unlearn, values_retrain,
                       bins, range_vals,
                       legend_unlearn, legend_retrain,
                       max_display=MAX_DISPLAY):
    """
    bins-1로 히스토그램 계산 후:
      - count <= max_display -> 전부 찍음
      - count >  max_display -> max_display개 + (나머지 압축표현)
    넘침 발견 시 x축에 break mark 표시
    """
    # bins-1 히스토그램
    if bins < 1:
        print("[Warning] bins<1 => skip plotting.")
        return

    counts_unlearn, bin_edges = np.histogram(values_unlearn, bins=bins-1, range=range_vals)
    counts_retrain, _ = np.histogram(values_retrain, bins=bins-1, range=range_vals)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    marker_sz = 6.5
    step = STEP
    start = 0.5

    break_mark_needed_left = False
    break_mark_needed_right = False

    for y, c_unlearn, c_retrain in zip(bin_centers, counts_unlearn, counts_retrain):
        # -- Retrain (회색, 왼쪽) --
        if c_retrain <= max_display:
            for i in range(c_retrain):
                x_val = -(i + start)*step
                ax.plot(x_val, y, 'o', color='gray', alpha=0.7, markersize=marker_sz)
        else:
            for i in range(max_display):
                x_val = -(i + start)*step
                ax.plot(x_val, y, 'o', color='gray', alpha=0.7, markersize=marker_sz)
            # 넘침 표시
            x_label_pos = -(max_display + 2 + start)*step
            ax.plot(x_label_pos, y, 'o', color='gray', alpha=0.7, markersize=marker_sz)
            ax.text(x_label_pos, y, str(c_retrain), color='gray',
                    ha='center', va='center', fontsize=7)
            # 압축영역
            leftover = c_retrain - max_display
            compr_step = 0.2
            for i in range(leftover):
                x_val = x_label_pos - (i+1)*compr_step
                ax.plot(x_val, y, 'o', color='gray', alpha=0.3, markersize=marker_sz-2)
            break_mark_needed_left = True

        # -- Unlearn (보라색, 오른쪽) --
        if c_unlearn <= max_display:
            for i in range(c_unlearn):
                x_val = (i + start)*step
                ax.plot(x_val, y, 'o', color='#8B5CF6', alpha=0.7, markersize=marker_sz)
        else:
            for i in range(max_display):
                x_val = (i + start)*step
                ax.plot(x_val, y, 'o', color='#8B5CF6', alpha=0.7, markersize=marker_sz)
            # 넘침 표시
            x_label_pos = (max_display + 2 + start)*step
            ax.plot(x_label_pos, y, 'o', color='#8B5CF6', alpha=0.7, markersize=marker_sz)
            ax.text(x_label_pos, y, str(c_unlearn), color='#8B5CF6',
                    ha='center', va='center', fontsize=7)
            leftover = c_unlearn - max_display
            compr_step = 0.2
            for i in range(leftover):
                x_val = x_label_pos + (i+1)*compr_step
                ax.plot(x_val, y, 'o', color='#8B5CF6', alpha=0.3, markersize=marker_sz-2)
            break_mark_needed_right = True

    # Forgetting Score / threshold 라인
    scores = calculate_scores(values_unlearn, values_retrain, bins, range_vals)
    if not scores:
        print("[Warning] no scores => skip threshold line.")
        return
    best_score = min(scores, key=lambda x: x['forgetting_score'])
    ax.axhline(y=best_score['threshold'], color='red', linestyle='--', alpha=0.5)

    text = (
        f"Optimal threshold: {best_score['threshold']:.2f}\n"
        f"FPR: {best_score['fpr']:.3f}\n"
        f"FNR: {best_score['fnr']:.3f}\n"
        f"Epsilon: {best_score['epsilon']:.3f}\n"
        f"Forgetting score: {best_score['forgetting_score']:.3f}"
    )
    ax.text(0.02, 0.98, text, transform=ax.transAxes,
            verticalalignment='top',
            bbox=dict(facecolor='white', alpha=0.8))

    # 범례
    handles = [
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='gray', markersize=7, label=legend_retrain),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#8B5CF6', markersize=7, label=legend_unlearn)
    ]
    ax.legend(handles=handles, loc='upper right')

    # 필요 시 break mark
    if break_mark_needed_left:
        # x= -((max_display + 1) + start)*step 정도
        x_break_left = -(max_display + 1 + start)*step
        make_break_marks_x(ax, x_break_left)
    if break_mark_needed_right:
        x_break_right = (max_display + 1 + start)*step
        make_break_marks_x(ax, x_break_right)

    # x축 범위를 항상 "max_display까지 찍을 수 있도록" 넉넉히 설정
    #  => ±((max_display + 3) + start)*step
    x_max = (max_display + 3 + start)*step
    ax.set_xlim([-x_max, x_max])

def main():
    force_class = 1

    # 예) 1/class_1_Retrain.json, 1/class_1_GA.json 등
    retrain_file = f'{force_class}/class_{force_class}_Retrain.json'
    unlearn_file = f'{force_class}/class_{force_class}_RL.json'

    # 레전드명 파싱 (파일 이름에서 prefix+suffix 제거)
    legend_retrain = retrain_file.replace(f'{force_class}/class_{force_class}_', '').replace('.json', '')
    legend_unlearn = unlearn_file.replace(f'{force_class}/class_{force_class}_', '').replace('.json', '')

    # JSON 로드
    with open(retrain_file, 'r') as f:
        retrain_data = json.load(f)
    with open(unlearn_file, 'r') as f:
        unlearn_data = json.load(f)

    plt.figure(figsize=(10, 12))

    # 위쪽: Entropy
    plt.subplot(2, 1, 1)
    ax1 = plt.gca()
    plot_distributions(
        ax1,
        unlearn_data['entropy']['values'],
        retrain_data['entropy']['values'],
        bins=unlearn_data['entropy']['bins'],
        range_vals=unlearn_data['entropy']['range'],
        legend_unlearn=legend_unlearn,
        legend_retrain=legend_retrain,
        max_display=40
    )
    plt.title(f'Class {force_class} Logit Entropy Distribution (Last 200)')

    # x축 눈금 등
    ax1.xaxis.set_major_locator(MultipleLocator(10 * STEP))
    ax1.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    plt.xlabel('Count')
    plt.ylabel('Entropy')
    plt.ylim([0.0, 2.5])
    plt.grid(True, alpha=0.2)

    # 아래쪽: Confidence
    plt.subplot(2, 1, 2)
    ax2 = plt.gca()
    plot_distributions(
        ax2,
        unlearn_data['confidence']['values'],
        retrain_data['confidence']['values'],
        bins=unlearn_data['confidence']['bins'],
        range_vals=unlearn_data['confidence']['range'],
        legend_unlearn=legend_unlearn,
        legend_retrain=legend_retrain,
        max_display=40
    )
    plt.title(f'Class {force_class} Max Logit Confidence Distribution')

    ax2.xaxis.set_major_locator(MultipleLocator(10 * STEP))
    ax2.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    plt.xlabel('Count')
    plt.ylabel('Log Confidence Score')
    plt.ylim([-2.5, 10.0])
    plt.grid(True, alpha=0.2)

    plt.tight_layout()
    plt.savefig(f'class_{force_class}_distribution_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()

if __name__ == "__main__":
    main()
