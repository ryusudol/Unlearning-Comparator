import json
import numpy as np
import matplotlib.pyplot as plt
import torch

from matplotlib.ticker import FuncFormatter, MultipleLocator
import matplotlib.gridspec as gridspec

STEP = 1.5
MAX_DISPLAY = 25

def count_formatter(x, pos):
    """x축 눈금을 'count'로 표기하기 위한 formatter"""
    if x == 0:
        return '0'
    val = abs(x)/STEP
    return str(int(round(val)))

def make_break_marks_x(ax, x_pos):
    """x축 위 x_pos 근처에 '축 끊김' 표시"""
    kwargs = dict(transform=ax.get_xaxis_transform(), color='k', clip_on=False)
    dx=0.3
    dy=0.02
    ax.plot([x_pos - dx, x_pos + dx], [-dy, dy], **kwargs)
    ax.plot([x_pos - dx, x_pos + dx], [-2*dy, 2*dy], **kwargs)


def calculate_scores(values_unlearn, values_retrain, bins, range_vals, mode='entropy'):
    """
    기존 로직:
    - Entropy: pos=Unlearn, conf>=threshold => Pred=Unlearn
    - Confidence: pos=Retrain, conf>=threshold => Pred=Retrain
    => fpr, fnr, forgetting_score 계산
    """
    if bins < 2 or range_vals[0] >= range_vals[1]:
        return []
    v_un = np.clip(values_unlearn, range_vals[0], range_vals[1])
    v_re = np.clip(values_retrain, range_vals[0], range_vals[1])
    thresholds = np.linspace(range_vals[0], range_vals[1], bins)

    if len(v_un)==0 or len(v_re)==0:
        return []

    scores=[]
    DELTA=1e-5
    EPS=1e-10

    for thr_val in thresholds:
        thr_ = torch.tensor(thr_val, dtype=torch.float32)
        if mode=='entropy':
            # pos=Unlearn => conf>=thr => pred=Unlearn
            pos_confs_= torch.from_numpy(v_un)
            neg_confs_= torch.from_numpy(v_re)
            tpr= torch.mean((pos_confs_>=thr_).float()).item()
            fpr= torch.mean((neg_confs_>=thr_).float()).item()
        else:
            # mode='confidence'
            # pos=Retrain => conf>=thr => pred=Retrain
            pos_confs_= torch.from_numpy(v_re)
            neg_confs_= torch.from_numpy(v_un)
            tpr= torch.mean((pos_confs_>=thr_).float()).item()
            fpr= torch.mean((neg_confs_>=thr_).float()).item()

        fnr= 1.0 - tpr
        if fpr==0 and fnr==0:
            epsilon= float('inf')
            fq= 0
        elif fpr>=(1-DELTA) or fnr>=(1-DELTA):
            epsilon=0
            fq=1
        else:
            sfp= np.clip(fpr, EPS, 1-DELTA-EPS)
            sfn= np.clip(fnr, EPS, 1-DELTA-EPS)
            lg1= np.log(1-DELTA - sfp) - np.log(sfn)
            lg2= np.log(1-DELTA - sfn) - np.log(sfp)
            epsilon= max(0, min(lg1, lg2))
            fq= 2**(-epsilon)

        scores.append({
            "threshold": float(thr_val),
            "fpr": fpr,
            "fnr": fnr,
            "epsilon": epsilon,
            "forgetting_score": fq
        })
    return scores


def plot_left_distribution(ax,
                           vals_unlearn, vals_retrain,
                           bins, range_vals,
                           legend_unlearn, legend_retrain,
                           max_display=MAX_DISPLAY,
                           mode='entropy'):
    """
    왼(음수x)=Actual=Retrain(회색), 오른(양수x)=Actual=Unlearn(보라).

    - Entropy: 위->아래
      => bin_val >= threshold => 이미 지나간 "위" 부분 => Pred=Unlearn => 진색
      => bin_val <  threshold => Pred=Retrain => 연색
    - Confidence: 아래->위
      => bin_val <= threshold => 이미 지나간 "아래" 부분 => Pred=Unlearn => 진색
      => bin_val >  threshold => Pred=Retrain => 연색
    """
    if bins<1:
        return None

    scores = calculate_scores(vals_unlearn, vals_retrain, bins, range_vals, mode=mode)
    if not scores:
        return None

    best_s= min(scores, key=lambda s:s['forgetting_score'])
    best_thr= best_s['threshold']
    fpr= best_s['fpr']
    fnr= best_s['fnr']
    eps= best_s['epsilon']
    fq= best_s['forgetting_score']
    eps_str= ("inf" if eps==float('inf') else f"{eps:.3f}")

    arr_un= np.clip(vals_unlearn, range_vals[0], range_vals[1])
    arr_re= np.clip(vals_retrain, range_vals[0], range_vals[1])
    c_re, bin_edges= np.histogram(arr_re, bins=bins-1, range=range_vals)  # left
    c_un, _       = np.histogram(arr_un, bins=bins-1, range=range_vals)
    bin_centers= (bin_edges[:-1]+ bin_edges[1:])/2

    # 색상:
    col_fp = '#2B2B2B'   # Dark Gray
    col_tn = 'gray'      # Light Gray
    col_tp = '#5B21B6'   # Dark Purple
    col_fn = '#8B5CF6'   # Light Purple

    if mode=='entropy':
        def pred_unlearn(val): return (val>=best_thr)
    else: # confidence
        def pred_unlearn(val): return (val<=best_thr)

    marker_sz=7
    step=STEP
    start=0.5
    break_left=False
    break_right=False

    for bin_val, re_count, un_count in zip(bin_centers, c_re, c_un):
        # 왼(Actual=Retrain)
        if pred_unlearn(bin_val):
            re_color= col_fp  # Pred=Unlearn => FP
        else:
            re_color= col_tn  # Pred=Retrain => TN

        if re_count<=max_display:
            for i in range(re_count):
                x_val= -(i+start)*step
                ax.plot(x_val, bin_val, 'o', color=re_color, alpha=0.7, markersize=marker_sz)
        else:
            for i in range(max_display):
                x_val= -(i+start)*step
                ax.plot(x_val, bin_val, 'o', color=re_color, alpha=0.7, markersize=marker_sz)
            x_label_pos= -(max_display+2+start)*step
            ax.plot(x_label_pos, bin_val, 'o', color=re_color, alpha=0.7, markersize=marker_sz)
            ax.text(x_label_pos, bin_val, str(re_count), color=re_color,
                    ha='center', va='center', fontsize=7)
            leftover= re_count-max_display
            for i in range(leftover):
                xx= x_label_pos-(i+1)*0.2
                ax.plot(xx, bin_val, 'o', color=re_color, alpha=0.3, markersize=marker_sz-2)
            break_left=True

        # 오른(Actual=Unlearn)
        if pred_unlearn(bin_val):
            un_color= col_tp  # Pred=Unlearn => TP
        else:
            un_color= col_fn  # Pred=Retrain => FN

        if un_count<=max_display:
            for i in range(un_count):
                x_val= (i+start)*step
                ax.plot(x_val, bin_val, 'o', color=un_color, alpha=0.7, markersize=marker_sz)
        else:
            for i in range(max_display):
                x_val= (i+start)*step
                ax.plot(x_val, bin_val, 'o', color=un_color, alpha=0.7, markersize=marker_sz)
            x_label_pos= (max_display+2+start)*step
            ax.plot(x_label_pos, bin_val, 'o', color=un_color, alpha=0.7, markersize=marker_sz)
            ax.text(x_label_pos, bin_val, str(un_count), color=un_color,
                    ha='center', va='center', fontsize=7)
            leftover= un_count-max_display
            for i in range(leftover):
                xx= x_label_pos+(i+1)*0.2
                ax.plot(xx, bin_val, 'o', color=un_color, alpha=0.3, markersize=marker_sz-2)
            break_right=True

    x_max= (max_display+3+start)*step
    ax.set_xlim([-x_max, x_max])
    
    # Remove top & right spine
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)

    if break_left:
        make_break_marks_x(ax, -(max_display+1+start)*step)
    if break_right:
        make_break_marks_x(ax, (max_display+1+start)*step)

    # Threshold 점선 => Dark Gray(#4D4D4D)
    ax.axhline(y=best_thr, color='#4D4D4D', linestyle='--', alpha=0.5)
    
    # Info text => color='black'
    txt=(
        f"Optimal threshold: {best_thr:.2f}\n"
        f"FPR: {fpr:.3f}\n"
        f"FNR: {fnr:.3f}\n"
        f"Epsilon: {eps_str}\n"
        f"Forgetting score: {fq:.3f}\n"
        f"(1 - Attack Score)"  # <-- "Attacking Score" -> "Attack Score"
    )
    ax.text(0.02, 0.98, txt, transform=ax.transAxes,
            va='top', color='black',
            bbox=dict(facecolor='white', alpha=0.8))

    ax.grid(axis='x', alpha=0.2)

    # 레전드
    custom_handles= [
        plt.Line2D([0],[0], marker='o', color='w',
                   markerfacecolor='#2B2B2B', markersize=8,
                   label='From Retrain / Pred. Unlearn (FP)'),
        plt.Line2D([0],[0], marker='o', color='w',
                   markerfacecolor='gray', markersize=8,
                   label='From Retrain / Pred. Retrain (TN)'),
        plt.Line2D([0],[0], marker='o', color='w',
                   markerfacecolor='#5B21B6', markersize=8,
                   label='From Unlearn / Pred. Unlearn (TP)'),
        plt.Line2D([0],[0], marker='o', color='w',
                   markerfacecolor='#8B5CF6', markersize=8,
                   label='From Unlearn / Pred. Retrain (FN)')
    ]
    ax.legend(handles=custom_handles, loc='upper right', fontsize=8)
    return scores

def plot_right_line(ax_line, scores, range_vals, out_json_path, mode='entropy'):
    """
    오른쪽 라인차트:
      - Attack Score(빨강), FPR(파랑), FNR(초록)
      - 이미 지난 구간=진, 안 지난 구간=연
      - Threshold 점선=#4D4D4D, 텍스트=검정
      - (수정) best_thr에서 Attack/FPR/FNR 교차점에 마커 표시
    """
    if not scores:
        return

    # threshold 오름차순 정렬
    sorted_s= sorted(scores, key=lambda s:s['threshold'])
    thr_list= np.array([s['threshold'] for s in sorted_s])
    fq_list= np.array([s['forgetting_score'] for s in sorted_s])
    attack_list= 1 - fq_list  # Attack Score (빨강 라인)

    fpr_arr= np.array([s['fpr'] for s in sorted_s])   # 파랑
    fnr_arr= np.array([s['fnr'] for s in sorted_s])   # 초록

    # JSON 저장
    out_data=[]
    for s in sorted_s:
        out_data.append({
            "threshold": round(s["threshold"],3),
            "fpr": round(s["fpr"],3),
            "fnr": round(s["fnr"],3),
            "attack_score": round(1 - s["forgetting_score"],3)
        })
    with open(out_json_path,'w') as f:
        json.dump(out_data, f, indent=2)

    # best_s => Attack Score가 최소(forgetting_score가 최소)인 지점
    best_s= min(sorted_s, key=lambda s:s['forgetting_score'])
    best_thr= best_s['threshold']         # y축
    best_attack= 1 - best_s['forgetting_score']  # x축 (빨강)
    best_fpr= best_s['fpr']               # x축 (파랑)
    best_fnr= best_s['fnr']               # x축 (초록)

    # 이미 지난/안 지난 구간
    if mode=='entropy':
        passed_mask= (thr_list>= best_thr - 1e-12)
        not_passed_mask= (thr_list< best_thr + 1e-12)
    else:
        passed_mask= (thr_list<= best_thr + 1e-12)
        not_passed_mask= (thr_list> best_thr - 1e-12)

    # Attack Score(빨강)
    ax_line.plot(attack_list[passed_mask], thr_list[passed_mask],
                 color='#E41A1C', alpha=1.0, linewidth=2.0, label='Attack Score')
    ax_line.plot(attack_list[not_passed_mask], thr_list[not_passed_mask],
                 color='#E41A1C', alpha=0.3, linewidth=2.0)

    # FPR(파랑)
    ax_line.plot(fpr_arr[passed_mask], thr_list[passed_mask],
                 color='#377EB8', alpha=1.0, linewidth=2.0, label='False Positive Rate')
    ax_line.plot(fpr_arr[not_passed_mask], thr_list[not_passed_mask],
                 color='#377EB8', alpha=0.3, linewidth=2.0)

    # FNR(초록)
    ax_line.plot(fnr_arr[passed_mask], thr_list[passed_mask],
                 color='#4DAF4A', alpha=1.0, linewidth=2.0, label='False Negative Rate')
    ax_line.plot(fnr_arr[not_passed_mask], thr_list[not_passed_mask],
                 color='#4DAF4A', alpha=0.3, linewidth=2.0)

    # best_thr 수평 점선
    ax_line.axhline(y=best_thr, color='#4D4D4D', linestyle='--', alpha=0.5)

    # (A) Attack Score 교차점 => (best_attack, best_thr)
    #    마커=동그라미, 검정 테두리, 색=빨강 or 검정
    ax_line.plot([best_attack], [best_thr],
                 marker='o', markersize=5,
                 markerfacecolor='#E41A1C', markeredgecolor='black')

    # (B) FPR 교차점 => (best_fpr, best_thr)
    ax_line.plot([best_fpr], [best_thr],
                 marker='o', markersize=5,
                 markerfacecolor='#377EB8', markeredgecolor='black')

    # (C) FNR 교차점 => (best_fnr, best_thr)
    ax_line.plot([best_fnr], [best_thr],
                 marker='o', markersize=5,
                 markerfacecolor='#4DAF4A', markeredgecolor='black')

    # 텍스트
    label_txt= (
        f"Threshold: {best_thr:.2f}\n"
        f"Attack Score: {best_attack:.3f}\n"
        f"FPR: {best_fpr:.3f}\n"
        f"FNR: {best_fnr:.3f}"
    )
    y_shift= (range_vals[1] - range_vals[0])*0.01
    ax_line.text(best_attack, best_thr + y_shift, label_txt,
                 color='black', ha='left', va='bottom', fontsize=8)

    # x, y 범위
    x_min= min( attack_list.min(), fpr_arr.min(), fnr_arr.min() )
    x_max= max(1.0, attack_list.max()+0.05, fpr_arr.max()+0.05, fnr_arr.max()+0.05 )
    ax_line.set_xlim([ x_min, x_max ])
    ax_line.set_ylim( range_vals )
    ax_line.set_yticks([])
    ax_line.yaxis.set_ticklabels([])

    # Remove top, right spines
    for spine in ["top","right"]:
        ax_line.spines[spine].set_visible(False)

    ax_line.set_xlabel("Value")
    ax_line.legend(loc='upper right', fontsize=8)
    ax_line.grid(True, alpha=0.2)


def main():
    forget_class=1

    retrain_file= f'{forget_class}/class_{forget_class}_Retrain.json'
    unlearn_file= f'{forget_class}/class_{forget_class}_GA3.json'
    legend_retrain= retrain_file.replace(f'{forget_class}/class_{forget_class}_','').replace('.json','')
    legend_unlearn= unlearn_file.replace(f'{forget_class}/class_{forget_class}_','').replace('.json','')

    with open(retrain_file,'r') as f:
        retrain_data= json.load(f)
    with open(unlearn_file,'r') as f:
        unlearn_data= json.load(f)

    fig= plt.figure(figsize=(11,15))
    gs= gridspec.GridSpec(
        nrows=2,ncols=2,
        width_ratios=[5,2],
        height_ratios=[1,1],
        wspace=0.01,
        hspace=0.15
    )

    # (0,0)=Entropy left, (0,1)=Entropy right
    ax_ent= fig.add_subplot(gs[0,0])
    ax_ent_line= fig.add_subplot(gs[0,1])

    # (1,0)=Confidence left, (1,1)=Confidence right
    ax_conf= fig.add_subplot(gs[1,0])
    ax_conf_line= fig.add_subplot(gs[1,1])

    # 1) Entropy
    sc_ent= plot_left_distribution(
        ax=ax_ent,
        vals_unlearn= unlearn_data['entropy']['values'],
        vals_retrain= retrain_data['entropy']['values'],
        bins= unlearn_data['entropy']['bins'],
        range_vals= unlearn_data['entropy']['range'],
        legend_unlearn= legend_unlearn,
        legend_retrain= legend_retrain,
        mode='entropy'
    )
    ax_ent.set_title(f'Class {forget_class} Retrain (a00{forget_class}) vs Unlearn (1234)')
    ax_ent.xaxis.set_major_locator(MultipleLocator(10*STEP))
    ax_ent.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    ax_ent.set_xlabel('Count')
    ax_ent.set_ylabel('Entropy')
    ax_ent.set_ylim( unlearn_data['entropy']['range'] )

    if sc_ent:
        plot_right_line(
            ax_ent_line, sc_ent, unlearn_data['entropy']['range'],
            out_json_path="entropy_scores.json",
            mode='entropy'
        )

    # 2) Confidence
    sc_conf= plot_left_distribution(
        ax=ax_conf,
        vals_unlearn= unlearn_data['confidence']['values'],
        vals_retrain= retrain_data['confidence']['values'],
        bins= unlearn_data['confidence']['bins'],
        range_vals= unlearn_data['confidence']['range'],
        legend_unlearn= legend_unlearn,
        legend_retrain= legend_retrain,
        mode='confidence'
    )
    ax_conf.set_title(f'Class {forget_class} Retrain (a00{forget_class}) vs Unlearn (1234)')
    ax_conf.xaxis.set_major_locator(MultipleLocator(10*STEP))
    ax_conf.xaxis.set_major_formatter(FuncFormatter(count_formatter))
    ax_conf.set_xlabel('Count')
    ax_conf.set_ylabel('Logit Confidence')
    ax_conf.set_ylim( unlearn_data['confidence']['range'] )

    if sc_conf:
        plot_right_line(
            ax_conf_line, sc_conf, unlearn_data['confidence']['range'],
            out_json_path="confidence_scores.json",
            mode='confidence'
        )

    plt.savefig(f'class_{forget_class}_distribution_comparison_{legend_unlearn}.png', dpi=300, bbox_inches='tight')
    plt.close()

if __name__=="__main__":
    main()
