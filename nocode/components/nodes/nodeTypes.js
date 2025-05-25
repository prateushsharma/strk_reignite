// src/components/nodes/NodeTypes.js
import StartNode from './StartNode';
import PaymentNode from './PaymentNode';
import NotificationNode from './NotificationNode';
import AgentNode from './AgentNode';
import ModelNode from './ModelNode';
import MemoryNode from './MemoryNode';
import ToolNode from './ToolNode';
import StrategyNode from './StrategyNode';
import TelegramNode from './TelegramNode'; // Add this import

// Export node types object for ReactFlow
export const nodeTypes = {
  startNode: StartNode,
  paymentNode: PaymentNode,
  notificationNode: NotificationNode,
  agentNode: AgentNode,
  modelNode: ModelNode,
  memoryNode: MemoryNode,
  toolNode: ToolNode,
  strategyNode: StrategyNode,
  telegramNode: TelegramNode,
};