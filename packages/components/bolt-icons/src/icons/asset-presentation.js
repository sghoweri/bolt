import { h } from '@bolt/core/renderers';

export const AssetPresentation = ({
  bgColor,
  fgColor,
  size,
  ...otherProps
}) => {
  return (
    <svg {...otherProps} viewBox="0 0 24 24">
      <g fill={bgColor} fill-rule="evenodd">
        <path d="M21 3.283v12.434a.285.285 0 01-.291.276H3.291A.285.285 0 013 15.717V3.283c0-.152.131-.276.291-.276h17.418c.16 0 .291.124.291.276M23 1H1a1.001 1.001 0 000 2h.001L1 3.044v12.912c0 1.128.962 2.046 2.144 2.046h6.088l-2.096 3.52a.961.961 0 00-.102.748c.07.258.237.472.472.605a1.014 1.014 0 001.357-.358l2.688-4.515h.898l2.689 4.516c.185.311.521.485.865.484.168 0 .337-.04.491-.127a.983.983 0 00.472-.603.968.968 0 00-.103-.752l-2.095-3.518h6.089c1.182 0 2.143-.918 2.143-2.046V3.044L22.999 3H23a1.001 1.001 0 000-2" />
        <path d="M18.972 5.024h-.001a.99.99 0 00-.708.295l-4.406 5.288-4.092-3.26-.008-.01v-.024l-.052-.029a.981.981 0 00-1.38.006L4.26 11.354a.976.976 0 00.691 1.67.981.981 0 00.693-.285l3.41-3.41 4.22 3.371.013.012c.19.19.44.292.7.292h.008c.284-.01.526-.1.774-.366l4.91-5.902a1.004 1.004 0 00-.708-1.712" />
      </g>
    </svg>
  );
};
