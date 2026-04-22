import java.util.*;

public class GaleShapley {
    public static void assignRoommates(List<UniversityStudent> students) {

        // resets all the roomamtes
        for (UniversityStudent s : students) {
            s.setRoommate(null);
        }

        // build a namemap for easy student loolup
        Map<String, UniversityStudent> nameMap = new HashMap<>();
        for (UniversityStudent s : students) {
            nameMap.put(s.name, s);
        }

        // helps with trackgin every new index
        Map<UniversityStudent, Integer> newIndex = new HashMap<>();
        for (UniversityStudent s : students) {
            newIndex.put(s, 0);
        }

        // the queue of free stuendets who still have propsilas to ame
        Queue<UniversityStudent> free = new LinkedList<>();
        for (UniversityStudent s : students) {
            if (!s.roommatePreferences.isEmpty()) {
                free.add(s);
            }
        }

        // keep going while there is somehintg in the queue
        while (!free.isEmpty()) {
            // make a new one
            UniversityStudent newOne = free.poll();

            // skip if already paired
            if (newOne.getRoommate() != null){
                continue;
            }

            int idx = newIndex.get(newOne);
            if (idx >= newOne.roommatePreferences.size()){
                // exhausred preferences
                continue;
            }

            String targetName = newOne.roommatePreferences.get(idx);
            newIndex.put(newOne, idx + 1);

            UniversityStudent target = nameMap.get(targetName);
            if (target == null) {
                // when there is unknown studen in preferences, keep on trying
                if (idx + 1 < newOne.roommatePreferences.size()) {
                    free.add(newOne);
                }
                continue;
            }

            if (target.getRoommate() == null) {
                // target is free, so pair
                newOne.setRoommate(target);
                target.setRoommate(newOne);
                System.out.println("Paired: " + newOne.name + " <-> " + target.name);
            } else {
                // target is currently paired, but check if they prefer newOne
                UniversityStudent currentRoommate = target.getRoommate();
                int currentRank = target.roommatePreferences.indexOf(currentRoommate.name);
                int newRank = target.roommatePreferences.indexOf(newOne.name);

                // see if they eant new ot nah
                boolean targetPrefersNew = (newRank != -1) && (currentRank == -1 || newRank < currentRank);

                if (targetPrefersNew) {
                    // switch them
                    currentRoommate.setRoommate(null);
                    newOne.setRoommate(target);
                    target.setRoommate(newOne);
                    System.out.println("Re-paired: " + newOne.name + " <-> " + target.name + " (displaced " + currentRoommate.name + ")");
                    // former roommate goes back in queue
                    if (newIndex.get(currentRoommate) < currentRoommate.roommatePreferences.size()) {
                        free.add(currentRoommate);
                    }
                } else {
                    // target prefers current roommate, newOne tries next
                    if (idx + 1 < newOne.roommatePreferences.size()) {
                        free.add(newOne);
                    }
                }
            }
        }

        System.out.println("\n Roommate Assignments");
        Set<String> printed = new HashSet<>();
        for (UniversityStudent s : students) {
            if (s.getRoommate() != null && !printed.contains(s.name)) {
                System.out.println(s.name + " <-> " + s.getRoommate().name);
                printed.add(s.name);
                printed.add(s.getRoommate().name);
            } else if (s.getRoommate() == null) {
                System.out.println(s.name + " -> Unpaired");
            }
        }

    }
}
