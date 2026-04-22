import java.util.*;

public class StudentGraph {

    // edge class for the graph
    public static class Edge {
        public UniversityStudent neighbor;
        public int weight;

        // conrsuctor
        public Edge(UniversityStudent neighbor, int weight) {
            this.neighbor = neighbor;
            this.weight = weight;
        }
    }

    // adjancency list
    private Map<UniversityStudent, List<Edge>> adjacencyList;


    // construcotr
    public StudentGraph(List<UniversityStudent> students) {
        adjacencyList = new HashMap<>();

        // adds all students as nodes
        for (UniversityStudent s : students) {
            adjacencyList.put(s, new ArrayList<>());
        }

        // puts edges betewwen all the pairs, nested loop
        for (int i = 0; i < students.size(); i++) {
            for (int j = i + 1; j < students.size(); j++) {
                UniversityStudent a = students.get(i);
                UniversityStudent b = students.get(j);
                // need to get weight
                int weight = a.calculateConnectionStrength(b);
                // if waithgt above 0, make an edge
                if (weight > 0) {
                    addEdge(a, b, weight);
                }
            }
        }
    }

    // adds to the adjanency list with wieght gicen 2 students
    // both ways because not directional
    public void addEdge(UniversityStudent a, UniversityStudent b, int weight) {
        adjacencyList.get(a).add(new Edge(b, weight));
        adjacencyList.get(b).add(new Edge(a, weight));
    }

    // gets neighbors from adjaenency list using a studnet as input
    public List<Edge> getNeighbors(UniversityStudent student) {
        return adjacencyList.getOrDefault(student, new ArrayList<>());
    }

    // gets all the nodes
    public Set<UniversityStudent> getAllNodes() {
        return adjacencyList.keySet();
    }


    // displays graph
    public void displayGraph() {
        System.out.println("\nStudent Graph, Adjacency List");
        for (Map.Entry<UniversityStudent, List<Edge>> entry : adjacencyList.entrySet()) {
            StringBuilder sb = new StringBuilder();
            sb.append(entry.getKey().name).append(" -> [");
            List<Edge> edges = entry.getValue();
            for (int i = 0; i < edges.size(); i++) {
                sb.append("(").append(edges.get(i).neighbor.name)
                        .append(", ").append(edges.get(i).weight).append(")");
                if (i < edges.size() - 1) sb.append(", ");
            }
            sb.append("]");
            System.out.println(sb.toString());
        }
    }



}
