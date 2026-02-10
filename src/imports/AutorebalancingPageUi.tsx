import svgPaths from "./svg-lcrhpmp13q";

function Heading() {
  return (
    <div className="content-stretch flex h-[36px] items-start relative shrink-0 w-full" data-name="Heading 1">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[36px] not-italic relative shrink-0 text-[30px] text-white tracking-[0.3955px] whitespace-pre">Auto-Rebalancing Dashboard</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">BTC Perpetual Funding Rate Arbitrage</p>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[68px] items-start left-0 top-0 w-[414.375px]" data-name="Container">
      <Heading />
      <Paragraph />
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[20px] text-white top-0 tracking-[-0.4492px] whitespace-pre">Rebalance Threshold Monitor</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#90a1b9] text-[14px] top-[0.5px] tracking-[-0.1504px] w-[188px] whitespace-pre-wrap">Last rebalanced: 2 hours ago</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[52px] relative shrink-0 w-[275.648px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative size-full">
        <Heading1 />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_369_600)" id="Icon">
          <path d={svgPaths.p2de5ff00} id="Vector" stroke="var(--stroke-0, #00D492)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p3fe63d80} id="Vector_2" stroke="var(--stroke-0, #00D492)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
        <defs>
          <clipPath id="clip0_369_600">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="flex-[1_0_0] h-[24px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#00d492] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Auto-Rebalance Active</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[24px] relative shrink-0 w-[197.281px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon />
        <Text />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex h-[52px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Text1() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[136.977px]" data-name="Text">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#cad5e2] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Current Imbalance</p>
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[65.484px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#62748e] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Safe Zone</p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[163.477px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#62748e] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Auto-rebalances at 100%</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex h-[20px] items-center justify-between left-0 top-[72px] w-[1207px]" data-name="Container">
      <Text2 />
      <Text3 />
    </div>
  );
}

function Container5() {
  return <div className="absolute bg-gradient-to-r from-[#00bc7d] h-[32px] left-0 to-[#096] top-0 w-[205.188px]" data-name="Container" />;
}

function Text4() {
  return (
    <div className="absolute h-[20px] left-[582.7px] top-[6px] w-[41.609px]" data-name="Text">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[14px] text-white top-[0.5px] tracking-[-0.1504px] w-[42px] whitespace-pre-wrap">17.0%</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute bg-[#0f172b] h-[32px] left-0 overflow-clip rounded-[16777200px] top-[32px] w-[1207px]" data-name="Container">
      <Container5 />
      <Text4 />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[92px] relative shrink-0 w-full" data-name="Container">
      <Text1 />
      <Container4 />
      <Container6 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#00d492] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">✓ Positions balanced - within safe threshold</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[rgba(0,188,125,0.1)] h-[58px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(0,188,125,0.3)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="content-stretch flex flex-col items-start pb-px pt-[17px] px-[17px] relative size-full">
        <Paragraph2 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] h-[166px] items-start relative shrink-0 w-full" data-name="Container">
      <Container7 />
      <Container8 />
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute bg-[rgba(29,41,61,0.5)] content-stretch flex flex-col gap-[16px] h-[284px] items-start left-0 pb-px pt-[25px] px-[25px] rounded-[10px] top-[92px] w-[1257px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#314158] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container3 />
      <Container9 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-0 size-[16px] top-[2px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M8 1.33333V14.6667" id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p5120400} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Icon1 />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[24px] not-italic text-[#90a1b9] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Net PnL</p>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-0 not-italic text-[#05df72] text-[24px] top-0 tracking-[0.0703px] w-[141px] whitespace-pre-wrap">+0.00 USDC</p>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute bg-[rgba(29,41,61,0.5)] content-stretch flex flex-col gap-[8px] h-[94px] items-start left-0 pb-px pt-[17px] px-[17px] rounded-[10px] top-0 w-[408.328px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#314158] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container11 />
      <Container12 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-0 size-[16px] top-[2px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p3155f180} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pea6a680} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Icon2 />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[24px] not-italic text-[#90a1b9] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Funding Arbitrage</p>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-0 not-italic text-[#00d492] text-[24px] top-0 tracking-[0.0703px] w-[123px] whitespace-pre-wrap">+0.0600%</p>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute bg-[rgba(29,41,61,0.5)] content-stretch flex flex-col gap-[8px] h-[94px] items-start left-[424.33px] pb-px pt-[17px] px-[17px] rounded-[10px] top-0 w-[408.336px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#314158] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container14 />
      <Container15 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-0 size-[16px] top-[2px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_369_616)" id="Icon">
          <path d={svgPaths.p2d09d900} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_369_616">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Icon3 />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[24px] not-italic text-[#90a1b9] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Distance to Threshold</p>
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-0 not-italic text-[#cad5e2] text-[24px] top-0 tracking-[0.0703px] w-[96px] whitespace-pre-wrap">$415.00</p>
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute bg-[rgba(29,41,61,0.5)] content-stretch flex flex-col gap-[8px] h-[94px] items-start left-[848.66px] pb-px pt-[17px] px-[17px] rounded-[10px] top-0 w-[408.336px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#314158] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container17 />
      <Container18 />
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute h-[94px] left-0 top-[400px] w-[1257px]" data-name="Container">
      <Container13 />
      <Container16 />
      <Container19 />
    </div>
  );
}

function Container21() {
  return (
    <div className="relative rounded-[10px] shrink-0 size-[48px]" data-name="Container" style={{ backgroundImage: "linear-gradient(135deg, rgb(43, 127, 255) 0%, rgb(21, 93, 252) 100%)" }}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[16px] text-white tracking-[-0.3125px] whitespace-pre">HL</p>
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[20px] text-white top-0 tracking-[-0.4492px] whitespace-pre">Hyperliquid</p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#90a1b9] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">BTC-PERP</p>
    </div>
  );
}

function Container22() {
  return (
    <div className="flex-[1_0_0] h-[48px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading2 />
        <Paragraph3 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[48px] relative shrink-0 w-[169.438px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container21 />
        <Container22 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="bg-[rgba(0,201,80,0.2)] h-[28px] relative rounded-[16777200px] shrink-0 w-[56.617px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[12px] not-italic text-[#05df72] text-[14px] top-[4.5px] tracking-[-0.1504px] whitespace-pre">Long</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex h-[48px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container23 />
      <Container24 />
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[24px] relative shrink-0 w-[78.906px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Entry Price</p>
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="h-[24px] relative shrink-0 w-[63.547px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[64px] whitespace-pre-wrap">$96,250</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-0 w-[564.5px]" data-name="Container">
      <Text5 />
      <Text6 />
    </div>
  );
}

function Text7() {
  return (
    <div className="h-[24px] relative shrink-0 w-[95.93px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Current Price</p>
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="h-[24px] relative shrink-0 w-[63.617px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[64px] whitespace-pre-wrap">$96,335</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[36px] w-[564.5px]" data-name="Container">
      <Text7 />
      <Text8 />
    </div>
  );
}

function Text9() {
  return (
    <div className="h-[24px] relative shrink-0 w-[30.43px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Size</p>
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div className="h-[24px] relative shrink-0 w-[42.633px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[43px] whitespace-pre-wrap">1 BTC</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[72px] w-[564.5px]" data-name="Container">
      <Text9 />
      <Text10 />
    </div>
  );
}

function Container29() {
  return <div className="absolute bg-[#314158] h-px left-0 top-[108px] w-[564.5px]" data-name="Container" />;
}

function Text11() {
  return (
    <div className="h-[24px] relative shrink-0 w-[49.836px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Margin</p>
      </div>
    </div>
  );
}

function Text12() {
  return (
    <div className="h-[24px] relative shrink-0 w-[60.813px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[61px] whitespace-pre-wrap">$15,000</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[117px] w-[564.5px]" data-name="Container">
      <Text11 />
      <Text12 />
    </div>
  );
}

function Text13() {
  return (
    <div className="h-[24px] relative shrink-0 w-[109.031px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Unrealized PnL</p>
      </div>
    </div>
  );
}

function Text14() {
  return (
    <div className="h-[24px] relative shrink-0 w-[106.039px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#05df72] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[107px] whitespace-pre-wrap">+85.00 USDC</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[153px] w-[564.5px]" data-name="Container">
      <Text13 />
      <Text14 />
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[24px] relative shrink-0 w-[130.352px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Funding Rate (8h)</p>
      </div>
    </div>
  );
}

function Text16() {
  return (
    <div className="h-[24px] relative shrink-0 w-[76.297px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#00d492] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[77px] whitespace-pre-wrap">-0.8900%</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[189px] w-[564.5px]" data-name="Container">
      <Text15 />
      <Text16 />
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[213px] relative shrink-0 w-full" data-name="Container">
      <Container26 />
      <Container27 />
      <Container28 />
      <Container29 />
      <Container30 />
      <Container31 />
      <Container32 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p32887f80} id="Vector" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3b6ee540} id="Vector_2" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p188b8380} id="Vector_3" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3694d280} id="Vector_4" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text17() {
  return (
    <div className="flex-[1_0_0] h-[20px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#dab2ff] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Netted with Users</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[20px] relative shrink-0 w-[142.875px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon4 />
        <Text17 />
      </div>
    </div>
  );
}

function Text18() {
  return (
    <div className="h-[24px] relative shrink-0 w-[39.586px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#dab2ff] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[40px] whitespace-pre-wrap">$100</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex h-[24px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container34 />
      <Text18 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[16px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[12px] text-[rgba(218,178,255,0.7)] top-px whitespace-pre">Matched internally, no exchange execution needed</p>
    </div>
  );
}

function Container36() {
  return (
    <div className="bg-[rgba(173,70,255,0.1)] h-[74px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(173,70,255,0.3)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="content-stretch flex flex-col gap-[8px] items-start pb-px pt-[13px] px-[13px] relative size-full">
        <Container35 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_381_247)" id="Icon">
          <path d={svgPaths.p3e520100} id="Vector" stroke="var(--stroke-0, #05DF72)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1f2c5400} id="Vector_2" stroke="var(--stroke-0, #05DF72)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_381_247">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text19() {
  return (
    <div className="h-[20px] relative shrink-0 w-[214.969px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#05df72] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Fully Netted - No Hedge Needed</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="bg-[rgba(0,201,80,0.1)] h-[46px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(0,201,80,0.3)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center pl-[13px] pr-px py-px relative size-full">
          <Icon5 />
          <Text19 />
        </div>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[128px] items-start relative shrink-0 w-full" data-name="Container">
      <Container36 />
      <Container37 />
    </div>
  );
}

function Container39() {
  return (
    <div className="bg-[rgba(29,41,61,0.5)] col-[1] justify-self-stretch relative rounded-[10px] row-[1] self-stretch shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-2 border-[rgba(0,201,80,0.5)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="content-stretch flex flex-col gap-[16px] items-start pb-[2px] pt-[26px] px-[26px] relative size-full">
        <Container25 />
        <Container33 />
        <Container38 />
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="relative rounded-[10px] shrink-0 size-[48px]" data-name="Container" style={{ backgroundImage: "linear-gradient(135deg, rgb(173, 70, 255) 0%, rgb(152, 16, 250) 100%)" }}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[16px] text-white tracking-[-0.3125px] whitespace-pre">AS</p>
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[20px] text-white top-0 tracking-[-0.4492px] whitespace-pre">Paradex</p>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#90a1b9] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">BTC-PERP</p>
    </div>
  );
}

function Container41() {
  return (
    <div className="flex-[1_0_0] h-[48px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading3 />
        <Paragraph5 />
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="h-[48px] relative shrink-0 w-[136.484px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container40 />
        <Container41 />
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="bg-[rgba(251,44,54,0.2)] h-[28px] relative rounded-[16777200px] shrink-0 w-[60.25px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[12px] not-italic text-[#ff6467] text-[14px] top-[4.5px] tracking-[-0.1504px] whitespace-pre">Short</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex h-[48px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container42 />
      <Container43 />
    </div>
  );
}

function Text20() {
  return (
    <div className="h-[24px] relative shrink-0 w-[78.906px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Entry Price</p>
      </div>
    </div>
  );
}

function Text21() {
  return (
    <div className="h-[24px] relative shrink-0 w-[63.547px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[64px] whitespace-pre-wrap">$96,250</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-0 w-[564.5px]" data-name="Container">
      <Text20 />
      <Text21 />
    </div>
  );
}

function Text22() {
  return (
    <div className="h-[24px] relative shrink-0 w-[95.93px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Current Price</p>
      </div>
    </div>
  );
}

function Text23() {
  return (
    <div className="h-[24px] relative shrink-0 w-[63.617px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[64px] whitespace-pre-wrap">$96,335</p>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[36px] w-[564.5px]" data-name="Container">
      <Text22 />
      <Text23 />
    </div>
  );
}

function Text24() {
  return (
    <div className="h-[24px] relative shrink-0 w-[30.43px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Size</p>
      </div>
    </div>
  );
}

function Text25() {
  return (
    <div className="h-[24px] relative shrink-0 w-[42.633px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[43px] whitespace-pre-wrap">1 BTC</p>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[72px] w-[564.5px]" data-name="Container">
      <Text24 />
      <Text25 />
    </div>
  );
}

function Container48() {
  return <div className="absolute bg-[#314158] h-px left-0 top-[108px] w-[564.5px]" data-name="Container" />;
}

function Text26() {
  return (
    <div className="h-[24px] relative shrink-0 w-[49.836px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Margin</p>
      </div>
    </div>
  );
}

function Text27() {
  return (
    <div className="h-[24px] relative shrink-0 w-[60.813px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[16px] text-white top-[-0.5px] tracking-[-0.3125px] w-[61px] whitespace-pre-wrap">$15,000</p>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[117px] w-[564.5px]" data-name="Container">
      <Text26 />
      <Text27 />
    </div>
  );
}

function Text28() {
  return (
    <div className="h-[24px] relative shrink-0 w-[109.031px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Unrealized PnL</p>
      </div>
    </div>
  );
}

function Text29() {
  return (
    <div className="h-[24px] relative shrink-0 w-[103.047px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#ff6467] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[104px] whitespace-pre-wrap">-85.00 USDC</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[153px] w-[564.5px]" data-name="Container">
      <Text28 />
      <Text29 />
    </div>
  );
}

function Text30() {
  return (
    <div className="h-[24px] relative shrink-0 w-[130.352px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#90a1b9] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-pre">Funding Rate (8h)</p>
      </div>
    </div>
  );
}

function Text31() {
  return (
    <div className="h-[24px] relative shrink-0 w-[78.555px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#00d492] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[79px] whitespace-pre-wrap">+0.9500%</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-0 top-[189px] w-[564.5px]" data-name="Container">
      <Text30 />
      <Text31 />
    </div>
  );
}

function Container52() {
  return (
    <div className="h-[213px] relative shrink-0 w-full" data-name="Container">
      <Container45 />
      <Container46 />
      <Container47 />
      <Container48 />
      <Container49 />
      <Container50 />
      <Container51 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p32887f80} id="Vector" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3b6ee540} id="Vector_2" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p188b8380} id="Vector_3" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3694d280} id="Vector_4" stroke="var(--stroke-0, #C27AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text32() {
  return (
    <div className="flex-[1_0_0] h-[20px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#dab2ff] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Netted with Users</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="h-[20px] relative shrink-0 w-[142.875px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon6 />
        <Text32 />
      </div>
    </div>
  );
}

function Text33() {
  return (
    <div className="h-[24px] relative shrink-0 w-[39.586px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#dab2ff] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[40px] whitespace-pre-wrap">$100</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="content-stretch flex h-[24px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container53 />
      <Text33 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[16px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[12px] text-[rgba(218,178,255,0.7)] top-px whitespace-pre">Matched internally, no exchange execution needed</p>
    </div>
  );
}

function Container55() {
  return (
    <div className="bg-[rgba(173,70,255,0.1)] h-[74px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(173,70,255,0.3)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="content-stretch flex flex-col gap-[8px] items-start pb-px pt-[13px] px-[13px] relative size-full">
        <Container54 />
        <Paragraph6 />
      </div>
    </div>
  );
}

function Icon7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_369_608)" id="Icon">
          <path d={svgPaths.p3eaa2980} id="Vector" stroke="var(--stroke-0, #05DF72)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1f2c5400} id="Vector_2" stroke="var(--stroke-0, #05DF72)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_369_608">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text34() {
  return (
    <div className="h-[20px] relative shrink-0 w-[214.969px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#05df72] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-pre">Fully Netted - No Hedge Needed</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="bg-[rgba(0,201,80,0.1)] h-[46px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(0,201,80,0.3)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center pl-[13px] pr-px py-px relative size-full">
          <Icon7 />
          <Text34 />
        </div>
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[128px] items-start relative shrink-0 w-full" data-name="Container">
      <Container55 />
      <Container56 />
    </div>
  );
}

function Container58() {
  return (
    <div className="bg-[rgba(29,41,61,0.5)] col-[2] justify-self-stretch relative rounded-[10px] row-[1] self-stretch shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-2 border-[rgba(251,44,54,0.5)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="content-stretch flex flex-col gap-[16px] items-start pb-[2px] pt-[26px] px-[26px] relative size-full">
        <Container44 />
        <Container52 />
        <Container57 />
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="absolute gap-[24px] grid grid-cols-[repeat(2,_minmax(0,_1fr))] grid-rows-[repeat(1,_minmax(0,_1fr))] h-[473px] left-0 top-[518px] w-[1257px]" data-name="Container">
      <Container39 />
      <Container58 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[20px] text-white top-0 tracking-[-0.4492px] whitespace-pre">Summary</p>
    </div>
  );
}

function Container60() {
  return (
    <div className="h-[40px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[40px] left-[173.36px] not-italic text-[#c27aff] text-[36px] text-center top-[0.5px] tracking-[0.3691px] translate-x-[-50%] w-[94px] whitespace-pre-wrap">$200</p>
    </div>
  );
}

function Container61() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[173.75px] not-italic text-[16px] text-center text-white top-[-0.5px] tracking-[-0.3125px] translate-x-[-50%] whitespace-pre">Netted Internally</p>
    </div>
  );
}

function Container62() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[173.47px] not-italic text-[#90a1b9] text-[14px] text-center top-[0.5px] tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">Matched with other users</p>
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute bg-[rgba(15,23,43,0.5)] content-stretch flex flex-col gap-[8px] h-[136px] items-start left-0 pb-0 pt-[20px] px-[20px] rounded-[10px] top-0 w-[386.328px]" data-name="Container">
      <Container60 />
      <Container61 />
      <Container62 />
    </div>
  );
}

function Container64() {
  return (
    <div className="h-[40px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[40px] left-[173.34px] not-italic text-[#fdc700] text-[36px] text-center top-[0.5px] tracking-[0.3691px] translate-x-[-50%] w-[48px] whitespace-pre-wrap">$0</p>
    </div>
  );
}

function Container65() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[173.26px] not-italic text-[16px] text-center text-white top-[-0.5px] tracking-[-0.3125px] translate-x-[-50%] whitespace-pre">Hedged on Exchanges</p>
    </div>
  );
}

function Container66() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[172.78px] not-italic text-[#90a1b9] text-[14px] text-center top-[0.5px] tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">Executed on-chain</p>
    </div>
  );
}

function Container67() {
  return (
    <div className="absolute bg-[rgba(15,23,43,0.5)] content-stretch flex flex-col gap-[8px] h-[136px] items-start left-[410.33px] pb-0 pt-[20px] px-[20px] rounded-[10px] top-0 w-[386.336px]" data-name="Container">
      <Container64 />
      <Container65 />
      <Container66 />
    </div>
  );
}

function Container68() {
  return (
    <div className="h-[40px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[40px] left-[173.66px] not-italic text-[#05df72] text-[36px] text-center top-[0.5px] tracking-[0.3691px] translate-x-[-50%] w-[99px] whitespace-pre-wrap">100%</p>
    </div>
  );
}

function Container69() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[173.13px] not-italic text-[16px] text-center text-white top-[-0.5px] tracking-[-0.3125px] translate-x-[-50%] whitespace-pre">Netting Efficiency</p>
    </div>
  );
}

function Container70() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[173.5px] not-italic text-[#90a1b9] text-[14px] text-center top-[0.5px] tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">{`Gas & fee savings`}</p>
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute bg-[rgba(15,23,43,0.5)] content-stretch flex flex-col gap-[8px] h-[136px] items-start left-[820.66px] pb-0 pt-[20px] px-[20px] rounded-[10px] top-0 w-[386.336px]" data-name="Container">
      <Container68 />
      <Container69 />
      <Container70 />
    </div>
  );
}

function Container72() {
  return (
    <div className="h-[136px] relative shrink-0 w-full" data-name="Container">
      <Container63 />
      <Container67 />
      <Container71 />
    </div>
  );
}

function Container73() {
  return (
    <div className="absolute bg-gradient-to-r content-stretch flex flex-col from-[rgba(173,70,255,0.1)] gap-[16px] h-[230px] items-start left-0 pb-px pt-[25px] px-[25px] rounded-[10px] to-[rgba(43,127,255,0.1)] top-[1015px] w-[1257px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(173,70,255,0.3)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Heading4 />
      <Container72 />
    </div>
  );
}

function AutoRebalanceDashboard() {
  return (
    <div className="h-[1245px] relative shrink-0 w-full" data-name="AutoRebalanceDashboard">
      <Container />
      <Container10 />
      <Container20 />
      <Container59 />
      <Container73 />
    </div>
  );
}

export default function AutorebalancingPageUi() {
  return (
    <div className="content-stretch flex flex-col items-start pb-0 pt-[24px] px-[24px] relative size-full" data-name="Autorebalancing Page UI" style={{ backgroundImage: "linear-gradient(135.265deg, rgb(2, 6, 24) 0%, rgb(15, 23, 43) 50%, rgb(2, 6, 24) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <AutoRebalanceDashboard />
    </div>
  );
}