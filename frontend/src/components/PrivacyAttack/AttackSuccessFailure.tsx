export default function AttackSuccessFailure() {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-around">
        <div>
          <p className="text-[17px] text-center">Attack Success</p>
          <p className="text-sm w-[200px]">
            From Retrain / Pred Retrain (Light Gray) + From Unlearn / Pred
            Unlearn (Dark Purple)
          </p>
        </div>
        <div>
          <p className="text-[17px] text-center">Attack Failure</p>
          <p className="text-sm w-[200px]">
            From Retrain / Pred Retrain (Light Gray) + From Unlearn / Pred
            Unlearn (Dark Purple)
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div>
          <span className="text-sm font-medium">Correct</span>
          <div></div>
        </div>
        <div className="mx-4" />
        <div>
          <span className="text-sm font-medium">Incorrect</span>
        </div>
      </div>
    </div>
  );
}
