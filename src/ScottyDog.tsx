// Real Scotty dog from the Figma design file — composed from 79 vector SVG parts

const assetPathPrefix = "/assets";

const imgGroup = `${assetPathPrefix}/40f3a.svg`;
const imgGroup1 = `${assetPathPrefix}/2b08a.svg`;
const imgGroup2 = `${assetPathPrefix}/0726a.svg`;
const imgGroup3 = `${assetPathPrefix}/a9c5f.svg`;
const imgGroup4 = `${assetPathPrefix}/7864c.svg`;
const imgGroup5 = `${assetPathPrefix}/77f49.svg`;
const imgGroup6 = `${assetPathPrefix}/8be04.svg`;
const imgGroup7 = `${assetPathPrefix}/cdc14.svg`;
const imgGroup8 = `${assetPathPrefix}/8917e.svg`;
const imgGroup9 = `${assetPathPrefix}/bc157.svg`;
const imgGroup10 = `${assetPathPrefix}/c2f4e.svg`;
const imgGroup11 = `${assetPathPrefix}/11172.svg`;
const imgGroup12 = `${assetPathPrefix}/92bb0.svg`;
const imgGroup13 = `${assetPathPrefix}/3e9c7.svg`;
const imgGroup14 = `${assetPathPrefix}/3f6e1.svg`;
const imgGroup15 = `${assetPathPrefix}/f065b.svg`;
const imgGroup16 = `${assetPathPrefix}/64d5f.svg`;
const imgGroup17 = `${assetPathPrefix}/d293f.svg`;
const imgGroup18 = `${assetPathPrefix}/bdd44.svg`;
const imgGroup19 = `${assetPathPrefix}/4482c.svg`;
const imgGroup20 = `${assetPathPrefix}/35057.svg`;
const imgGroup21 = `${assetPathPrefix}/46a87.svg`;
const imgGroup22 = `${assetPathPrefix}/e5d80.svg`;
const imgGroup23 = `${assetPathPrefix}/8a12d.svg`;
const imgGroup24 = `${assetPathPrefix}/6b117.svg`;
const imgGroup25 = `${assetPathPrefix}/2f61a.svg`;
const imgGroup26 = `${assetPathPrefix}/43d96.svg`;
const imgGroup27 = `${assetPathPrefix}/24ef3.svg`;
const imgGroup28 = `${assetPathPrefix}/e55fa.svg`;
const imgGroup29 = `${assetPathPrefix}/1829e.svg`;
const imgGroup30 = `${assetPathPrefix}/56119.svg`;
const imgGroup31 = `${assetPathPrefix}/a78b2.svg`;
const imgGroup32 = `${assetPathPrefix}/f8de3.svg`;
const imgGroup33 = `${assetPathPrefix}/c458a.svg`;
const imgGroup34 = `${assetPathPrefix}/22f14.svg`;
const imgGroup35 = `${assetPathPrefix}/4214e.svg`;
const imgGroup36 = `${assetPathPrefix}/8f81d.svg`;
const imgGroup37 = `${assetPathPrefix}/dce6e.svg`;
const imgGroup38 = `${assetPathPrefix}/1cda0.svg`;
const imgGroup39 = `${assetPathPrefix}/92e75.svg`;
const imgGroup40 = `${assetPathPrefix}/893e4.svg`;
const imgGroup41 = `${assetPathPrefix}/75e4f.svg`;
const imgGroup42 = `${assetPathPrefix}/8f7b2.svg`;
const imgGroup43 = `${assetPathPrefix}/1f639.svg`;
const imgGroup44 = `${assetPathPrefix}/6ee91.svg`;
const imgGroup45 = `${assetPathPrefix}/f7dbf.svg`;
const imgGroup46 = `${assetPathPrefix}/bd12c.svg`;
const imgGroup47 = `${assetPathPrefix}/8c199.svg`;
const imgGroup48 = `${assetPathPrefix}/c1574.svg`;
const imgGroup49 = `${assetPathPrefix}/227d8.svg`;
const imgGroup50 = `${assetPathPrefix}/10666.svg`;
const imgGroup51 = `${assetPathPrefix}/2b0da.svg`;
const imgGroup52 = `${assetPathPrefix}/89c02.svg`;
const imgGroup53 = `${assetPathPrefix}/a491b.svg`;
const imgGroup54 = `${assetPathPrefix}/fcae1.svg`;
const imgGroup55 = `${assetPathPrefix}/5a22e.svg`;
const imgGroup56 = `${assetPathPrefix}/7770c.svg`;
const imgGroup57 = `${assetPathPrefix}/635c8.svg`;
const imgGroup58 = `${assetPathPrefix}/19028.svg`;
const imgGroup59 = `${assetPathPrefix}/67fd7.svg`;
const imgGroup60 = `${assetPathPrefix}/f40ad.svg`;
const imgGroup61 = `${assetPathPrefix}/3749e.svg`;
const imgGroup62 = `${assetPathPrefix}/05720.svg`;
const imgGroup63 = `${assetPathPrefix}/9dab2.svg`;
const imgGroup64 = `${assetPathPrefix}/bd85e.svg`;
const imgGroup65 = `${assetPathPrefix}/56573.svg`;
const imgGroup66 = `${assetPathPrefix}/811e9.svg`;
const imgGroup67 = `${assetPathPrefix}/eda7c.svg`;
const imgGroup68 = `${assetPathPrefix}/be703.svg`;
const imgGroup69 = `${assetPathPrefix}/52650.svg`;
const imgGroup70 = `${assetPathPrefix}/cf139.svg`;
const imgGroup71 = `${assetPathPrefix}/91c3b.svg`;
const imgGroup72 = `${assetPathPrefix}/ac5cc.svg`;
const imgGroup73 = `${assetPathPrefix}/69b04.svg`;
const imgGroup74 = `${assetPathPrefix}/3812a.svg`;
const imgGroup75 = `${assetPathPrefix}/ff396.svg`;
const imgGroup76 = `${assetPathPrefix}/fb3f8.svg`;
const imgGroup77 = `${assetPathPrefix}/ba77b.svg`;
const imgGroup78 = `${assetPathPrefix}/45842.svg`;

interface ScottyDogProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function ScottyDog({ size = 132, style, className }: ScottyDogProps) {
  // Native size in Figma is 132×153. Scale proportionally.
  const scale = size / 132;
  const height = Math.round(153 * scale);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height,
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <div className="absolute inset-[7.55%_58.65%_74.23%_30.25%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} /></div>
      <div className="absolute inset-[7.41%_25.52%_74.33%_63.09%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1} /></div>
      <div className="absolute inset-[5.69%_24.02%_77.27%_28.66%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup2} /></div>
      <div className="absolute inset-[10.97%_29.81%_76.29%_34.98%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup3} /></div>
      <div className="absolute inset-[11.23%_59.25%_83.02%_35.58%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup4} /></div>
      <div className="absolute inset-[14.89%_23.01%_50.31%_27.81%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup5} /></div>
      <div className="absolute inset-[21.65%_31.58%_75.8%_61.46%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup6} /></div>
      <div className="absolute inset-[21.68%_56.43%_75.55%_36.02%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup7} /></div>
      <div className="absolute inset-[24.19%_55.4%_74.94%_40.31%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup8} /></div>
      <div className="absolute inset-[24.18%_36.61%_74.96%_59%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup9} /></div>
      <div className="absolute inset-[26.86%_36.35%_68.77%_58.56%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup10} /></div>
      <div className="absolute inset-[27.51%_37.39%_71.57%_61.49%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup11} /></div>
      <div className="absolute inset-[28.09%_45.49%_71.32%_48.45%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup12} /></div>
      <div className="absolute inset-[26.89%_54.81%_68.71%_39.92%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup13} /></div>
      <div className="absolute inset-[27.51%_55.88%_71.57%_43%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup14} /></div>
      <div className="absolute inset-[29.47%_45.78%_70.16%_48.59%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup15} /></div>
      <div className="absolute inset-[31.68%_65.8%_64.4%_30.77%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup16} /></div>
      <div className="absolute inset-[33.28%_59.13%_62.32%_32.34%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup17} /></div>
      <div className="absolute inset-[33.39%_28.67%_63.05%_63.08%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup18} /></div>
      <div className="absolute inset-[31.44%_25.07%_63.54%_70.34%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup19} /></div>
      <div className="absolute inset-[10.24%_19.45%_51.16%_56.43%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup20} /></div>
      <div className="absolute inset-[15.5%_38.41%_83.76%_59.99%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup21} /></div>
      <div className="absolute inset-[11.7%_28.18%_77.65%_65.89%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup22} /></div>
      <div className="absolute inset-[14.03%_29.36%_79.6%_67.53%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup23} /></div>
      <div className="absolute inset-[10.11%_11.32%_6.33%_16.49%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup24} /></div>
      <div className="absolute inset-[54.96%_27.94%_23.71%_34.39%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup25} /></div>
      <div className="absolute inset-[56.19%_28.36%_27.39%_65.61%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup26} /></div>
      <div className="absolute inset-[54.13%_29.36%_31.19%_33.22%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup27} /></div>
      <div className="absolute inset-[58.64%_46.82%_38.3%_50.07%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup28} /></div>
      <div className="absolute inset-[58.76%_45.37%_37.19%_48.89%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup29} /></div>
      <div className="absolute inset-[59.25%_47.1%_39.14%_50.52%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup30} /></div>
      <div className="absolute inset-[59.38%_47.26%_39.28%_50.67%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup31} /></div>
      <div className="absolute inset-[55.7%_34.38%_39.4%_54.35%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup32} /></div>
      <div className="absolute inset-[56.31%_50.89%_39.42%_39.57%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup33} /></div>
      <div className="absolute inset-[52.43%_59.84%_42.34%_35.28%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup34} /></div>
      <div className="absolute inset-[52.02%_30.29%_43.08%_64.87%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup35} /></div>
      <div className="absolute inset-[53.13%_38.09%_41.12%_37.65%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup36} /></div>
      <div className="absolute inset-[35.36%_31.52%_44.18%_35.8%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup37} /></div>
      <div className="absolute inset-[40.13%_56.44%_53.86%_36.47%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup38} /></div>
      <div className="absolute inset-[40.13%_32.32%_53.98%_60.28%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup39} /></div>
      <div className="absolute inset-[36.41%_40.61%_51.8%_44.89%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup40} /></div>
      <div className="absolute inset-[34.31%_33.95%_59.87%_38.24%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup41} /></div>
      <div className="absolute inset-[37.37%_43.42%_60.85%_47.26%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup42} /></div>
      <div className="absolute inset-[15.87%_66.79%_77.63%_32.91%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup43} /></div>
      <div className="absolute inset-[11.82%_61.46%_77.63%_33.05%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup44} /></div>
      <div className="absolute inset-[13.91%_63.09%_79.6%_33.95%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup45} /></div>
      <div className="absolute inset-[64.15%_68.89%_30.45%_25.81%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup46} /></div>
      <div className="absolute inset-[64.64%_55.55%_26.65%_40.27%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup47} /></div>
      <div className="absolute inset-[64.03%_20.04%_30.58%_73.74%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup48} /></div>
      <div className="absolute inset-[63.92%_68.26%_16.73%_23.01%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup49} /></div>
      <div className="absolute inset-[63.9%_17.72%_16.73%_73.49%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup50} /></div>
      <div className="absolute inset-[66.61%_60.8%_27.63%_37.85%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup51} /></div>
      <div className="absolute inset-[64.77%_35.13%_25.67%_60.72%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup52} /></div>
      <div className="absolute inset-[66.36%_66.63%_19.55%_28.77%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup53} /></div>
      <div className="absolute inset-[70.89%_53.89%_8.52%_42.82%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54} /></div>
      <div className="absolute inset-[71.38%_23.41%_15.62%_71.08%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup55} /></div>
      <div className="absolute inset-[69.3%_61.17%_24.2%_34.98%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup56} /></div>
      <div className="absolute inset-[68.93%_29.94%_22.37%_62.8%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup57} /></div>
      <div className="absolute inset-[70.4%_26.41%_7.66%_60.87%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup58} /></div>
      <div className="absolute inset-[71.88%_37.35%_8.52%_59.07%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup59} /></div>
      <div className="absolute inset-[70.89%_25.21%_20.53%_71.81%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup60} /></div>
      <div className="absolute inset-[70.77%_57.62%_23.71%_39.78%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup61} /></div>
      <div className="absolute inset-[67.59%_44.41%_22.73%_48.44%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup62} /></div>
      <div className="absolute inset-[72.37%_65.61%_15.87%_28.75%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup63} /></div>
      <div className="absolute inset-[72.49%_55.25%_7.65%_31.73%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup64} /></div>
      <div className="absolute inset-[75.8%_41.34%_11.47%_46.52%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup65} /></div>
      <div className="absolute inset-[79.34%_43.06%_16.49%_47.41%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup66} /></div>
      <div className="absolute inset-[82.05%_73.45%_17.69%_23.89%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup67} /></div>
      <div className="absolute inset-[83.58%_67.38%_9.72%_20.97%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup68} /></div>
      <div className="absolute inset-[83.64%_15.79%_9.62%_72.86%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup69} /></div>
      <div className="absolute inset-[83.64%_13.99%_12.2%_80.55%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup70} /></div>
      <div className="absolute inset-[83.39%_74.19%_12.33%_19.03%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup71} /></div>
      <div className="absolute inset-[87.44%_74.48%_10.23%_23.93%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup72} /></div>
      <div className="absolute inset-[88.05%_61.17%_8.65%_36.46%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup73} /></div>
      <div className="absolute inset-[89.02%_58.18%_8.39%_39.86%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup74} /></div>
      <div className="absolute inset-[89.28%_34.53%_8.26%_63.96%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup75} /></div>
      <div className="absolute inset-[88.05%_28.74%_9.36%_69.3%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup76} /></div>
      <div className="absolute inset-[88.05%_31.55%_8.32%_66.2%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup77} /></div>
      <div className="absolute inset-[91.36%_71.08%_8.39%_24.93%]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup78} /></div>
    </div>
  );
}
