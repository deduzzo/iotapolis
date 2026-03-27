import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
  tier: number; // 0=small, 1=medium, 2=large hub
}

interface Spark {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  fromNode: number;
  toNode: number;
}

export default function BlockchainBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let nodes: Node[] = [];
    let sparks: Spark[] = [];
    const nodeCount = 150;
    const connectionDistance = 200;
    const mouseRadius = 250;
    const maxSparks = 40;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };

    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const tier = Math.random() < 0.08 ? 2 : Math.random() < 0.25 ? 1 : 0;
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (tier === 2 ? 0.15 : 0.5),
          vy: (Math.random() - 0.5) * (tier === 2 ? 0.15 : 0.5),
          radius: tier === 2 ? 3.5 : tier === 1 ? 2.2 : 1.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.025,
          tier,
        });
      }
    };

    const spawnSpark = (fromIdx: number, toIdx: number) => {
      if (sparks.length >= maxSparks) return;
      const a = nodes[fromIdx];
      const b = nodes[toIdx];
      sparks.push({
        x: a.x, y: a.y,
        targetX: b.x, targetY: b.y,
        progress: 0,
        speed: 0.015 + Math.random() * 0.02,
        fromNode: fromIdx,
        toNode: toIdx,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scroll = scrollRef.current;
      const mouse = mouseRef.current;
      const time = Date.now() * 0.001;

      // Hex grid pattern that shifts with scroll
      const hexSize = 80;
      const scrollOffset = scroll * 0.1;
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.025)';
      ctx.lineWidth = 0.5;
      for (let row = -1; row < canvas.height / (hexSize * 0.75) + 2; row++) {
        for (let col = -1; col < canvas.width / hexSize + 2; col++) {
          const offsetX = row % 2 === 0 ? 0 : hexSize * 0.5;
          const cx = col * hexSize + offsetX;
          const cy = row * hexSize * 0.75 + (scrollOffset % (hexSize * 1.5));
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const angle = (Math.PI / 3) * s - Math.PI / 6;
            const hx = cx + Math.cos(angle) * hexSize * 0.4;
            const hy = cy + Math.sin(angle) * hexSize * 0.4;
            if (s === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();

          // Brighten hexes near mouse
          const hdx = cx - mouse.x;
          const hdy = cy - (mouse.y + scroll);
          const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
          if (hdist < mouseRadius * 1.5) {
            const brightness = (1 - hdist / (mouseRadius * 1.5)) * 0.08;
            ctx.strokeStyle = `rgba(108, 99, 255, ${0.025 + brightness})`;
          } else {
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.025)';
          }
          ctx.stroke();
        }
      }

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.pulse += node.pulseSpeed;

        // Mouse interaction
        const dx = node.x - mouse.x;
        const dy = node.y - (mouse.y + scroll);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          // Repulsion
          const force = (mouseRadius - dist) / mouseRadius * 0.6;
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;

          // Spawn sparks near mouse
          if (Math.random() < 0.03 && node.tier >= 1) {
            for (let j = 0; j < nodes.length; j++) {
              if (j === i) continue;
              const cdx = node.x - nodes[j].x;
              const cdy = node.y - nodes[j].y;
              const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
              if (cdist < connectionDistance * 0.8) {
                spawnSpark(i, j);
                break;
              }
            }
          }
        }

        // Damping
        node.vx *= 0.97;
        node.vy *= 0.97;

        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Wrap
        if (node.x < -20) node.x = canvas.width + 20;
        if (node.x > canvas.width + 20) node.x = -20;
        if (node.y < -20) node.y = canvas.height + 20;
        if (node.y > canvas.height + 20) node.y = -20;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const cdx = node.x - other.x;
          const cdy = node.y - other.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          const maxDist = (node.tier + other.tier >= 2) ? connectionDistance * 1.3 : connectionDistance;

          if (cdist < maxDist) {
            let opacity = (1 - cdist / maxDist) * 0.2;

            // Brighten near mouse
            const midX = (node.x + other.x) / 2;
            const midY = (node.y + other.y) / 2;
            const mdx = midX - mouse.x;
            const mdy = midY - (mouse.y + scroll);
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < mouseRadius) {
              opacity += (1 - mdist / mouseRadius) * 0.15;
            }

            // Hub connections brighter
            if (node.tier === 2 || other.tier === 2) {
              opacity *= 1.5;
            }

            ctx.strokeStyle = `rgba(108, 99, 255, ${Math.min(opacity, 0.4)})`;
            ctx.lineWidth = (node.tier + other.tier >= 3) ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulseSize = Math.sin(node.pulse) * 0.5 + 1;
        const r = node.radius * pulseSize;

        // Mouse proximity glow boost
        const dx = node.x - mouse.x;
        const dy = node.y - (mouse.y + scroll);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseGlow = dist < mouseRadius ? (1 - dist / mouseRadius) * 0.4 : 0;

        // Outer glow
        const glowRadius = node.tier === 2 ? r * 12 : node.tier === 1 ? r * 8 : r * 5;
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);

        if (node.tier === 2) {
          gradient.addColorStop(0, `rgba(192, 132, 252, ${0.4 + mouseGlow})`);
          gradient.addColorStop(0.5, `rgba(108, 99, 255, ${0.1 + mouseGlow * 0.3})`);
          gradient.addColorStop(1, 'rgba(108, 99, 255, 0)');
        } else {
          gradient.addColorStop(0, `rgba(108, 99, 255, ${0.25 + mouseGlow})`);
          gradient.addColorStop(1, 'rgba(108, 99, 255, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core with ring for hubs
        if (node.tier === 2) {
          // Pulsing ring
          const ringRadius = r * 3 + Math.sin(node.pulse * 1.5) * 2;
          ctx.strokeStyle = `rgba(192, 132, 252, ${0.2 + Math.sin(node.pulse) * 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Core dot
        const coreAlpha = node.tier === 2 ? 0.9 : node.tier === 1 ? 0.7 : 0.5;
        ctx.fillStyle = `rgba(167, 139, 250, ${coreAlpha + Math.sin(node.pulse) * 0.2 + mouseGlow})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw sparks (data packets)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.targetX = nodes[spark.toNode].x;
        spark.targetY = nodes[spark.toNode].y;

        spark.progress += spark.speed;
        if (spark.progress >= 1) {
          // Chain reaction: spark can trigger new spark from target node
          if (Math.random() < 0.3) {
            const fromNode = spark.toNode;
            for (let j = 0; j < nodes.length; j++) {
              if (j === fromNode || j === spark.fromNode) continue;
              const cdx = nodes[fromNode].x - nodes[j].x;
              const cdy = nodes[fromNode].y - nodes[j].y;
              const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
              if (cdist < connectionDistance) {
                spawnSpark(fromNode, j);
                break;
              }
            }
          }
          sparks.splice(i, 1);
          continue;
        }

        const fromNode = nodes[spark.fromNode];
        const t = spark.progress;
        const px = fromNode.x + (spark.targetX - fromNode.x) * t;
        const py = fromNode.y + (spark.targetY - fromNode.y) * t;

        // Trail
        const trailLength = 4;
        for (let tr = 0; tr < trailLength; tr++) {
          const tt = Math.max(0, t - tr * 0.03);
          const tx = fromNode.x + (spark.targetX - fromNode.x) * tt;
          const ty = fromNode.y + (spark.targetY - fromNode.y) * tt;
          const trailAlpha = (1 - tr / trailLength) * 0.6;
          ctx.fillStyle = `rgba(192, 132, 252, ${trailAlpha})`;
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5 - tr * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Spark glow
        const sparkGradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
        sparkGradient.addColorStop(0, 'rgba(192, 132, 252, 0.6)');
        sparkGradient.addColorStop(1, 'rgba(192, 132, 252, 0)');
        ctx.fillStyle = sparkGradient;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Auto-spawn sparks periodically for ambient activity
      if (Math.random() < 0.05) {
        const hubNodes = nodes.reduce<number[]>((acc, n, idx) => {
          if (n.tier >= 1) acc.push(idx);
          return acc;
        }, []);
        if (hubNodes.length > 0) {
          const fromIdx = hubNodes[Math.floor(Math.random() * hubNodes.length)];
          for (let j = 0; j < nodes.length; j++) {
            if (j === fromIdx) continue;
            const cdx = nodes[fromIdx].x - nodes[j].x;
            const cdy = nodes[fromIdx].y - nodes[j].y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cdist < connectionDistance) {
              spawnSpark(fromIdx, j);
              break;
            }
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    resize();
    initNodes();
    draw();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
